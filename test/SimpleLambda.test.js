import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  InvokeCommand,
  DeleteFunctionCommand,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { SimpleLambda } from "../lambda/simpleLambda.js";
import { SimpleIAM } from "../iam/simpleIAM.js";
import { Buffer } from "buffer";

// Mock the internal IAM dependency
jest.mock("../iam/simpleIAM.js");
jest.mock("@aws-sdk/client-lambda", () => ({
  ...jest.requireActual("@aws-sdk/client-lambda"),
  waitUntilFunctionActive: jest.fn().mockResolvedValue({}),
  waitUntilFunctionUpdated: jest.fn().mockResolvedValue({}),
}));

const {
  waitUntilFunctionActive,
  waitUntilFunctionUpdated,
} = require("@aws-sdk/client-lambda");

const lambdaMock = mockClient(LambdaClient);

describe("SimpleLambda", () => {
  let lambda;
  const FUNCTION_NAME = "test-lambda";
  const MOCK_ROLE_ARN = "arn:aws:iam::12345:role/boto3js-lambda-role";
  const MOCK_CODE = 'exports.handler = (e) => "hello";';
  const MOCK_ARN = `arn:aws:lambda:us-east-1:12345:function:${FUNCTION_NAME}`;

  beforeEach(() => {
    lambdaMock.reset();
    jest.clearAllMocks();
    jest.useFakeTimers();

    SimpleIAM.prototype.getRole = jest
      .fn()
      .mockResolvedValue({ Arn: MOCK_ROLE_ARN });
    SimpleIAM.prototype.createRole = jest
      .fn()
      .mockResolvedValue({ Arn: MOCK_ROLE_ARN });
    SimpleIAM.prototype.attachPolicyToRole = jest.fn().mockResolvedValue({});

    lambda = new SimpleLambda();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Constructor and Debugging", () => {
    test("should initialize without crashing", () => {
      expect(lambda).toBeInstanceOf(SimpleLambda);
      expect(lambda.client).toBeInstanceOf(LambdaClient);
      expect(lambda.iam).toBeInstanceOf(SimpleIAM);
    });

    test("should log output when debug is enabled", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const lambdaDebug = new SimpleLambda({}, { debug: true });
      lambdaMock.resolves({ Functions: [] });

      await lambdaDebug.listFunctions();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Function Operations", () => {
    test("listFunctions should return an array of functions", async () => {
      const mockFunctions = [{ FunctionName: "f1" }, { FunctionName: "f2" }];
      lambdaMock.resolves({ Functions: mockFunctions });
      const funcs = await lambda.listFunctions();
      expect(funcs).toEqual(mockFunctions);
    });

    test("listFunctions should return an empty array if none exist", async () => {
      lambdaMock.resolves({ Functions: null });
      const funcs = await lambda.listFunctions();
      expect(funcs).toEqual([]);
    });

    test("listFunctions should throw a formatted error on failure", async () => {
      lambdaMock.rejects(new Error("Access Denied"));
      await expect(lambda.listFunctions()).rejects.toThrow(
        "Lambda listFunctions failed: Access Denied"
      );
    });

    test("deploy should create a function, wait, and return ARN (existing role)", async () => {
      lambdaMock.resolves({ FunctionArn: MOCK_ARN });

      const arn = await lambda.deploy(FUNCTION_NAME, MOCK_CODE);

      expect(arn).toBe(MOCK_ARN);
      expect(lambda.iam.getRole).toHaveBeenCalledWith("boto3js-lambda-role");
      expect(lambda.iam.createRole).not.toHaveBeenCalled();
      expect(lambdaMock.commandCalls(CreateFunctionCommand).length).toBe(1);
      expect(
        lambdaMock.commandCalls(CreateFunctionCommand)[0].args[0].input
      ).toEqual(
        expect.objectContaining({
          FunctionName: FUNCTION_NAME,
          Role: MOCK_ROLE_ARN,
          Handler: "index.handler",
          Runtime: "nodejs18.x",
        })
      );

      expect(
        lambdaMock.commandCalls(CreateFunctionCommand)[0].args[0].input.Code
          .ZipFile
      ).toBeInstanceOf(Buffer);

      expect(waitUntilFunctionActive).toHaveBeenCalledWith(
        { client: lambda.client, maxWaitTime: 180 },
        { FunctionName: FUNCTION_NAME }
      );
    });

    test("deploy should create and attach a new role if one doesn't exist", async () => {
      SimpleIAM.prototype.getRole.mockRejectedValue(
        new Error("Role not found")
      );

      lambda = new SimpleLambda();

      lambdaMock.resolves({ FunctionArn: MOCK_ARN });

      const deployPromise = lambda.deploy(FUNCTION_NAME, MOCK_CODE);

      await jest.advanceTimersByTimeAsync(5000);

      const arn = await deployPromise;

      expect(arn).toBe(MOCK_ARN);
      expect(lambda.iam.getRole).toHaveBeenCalled();
      expect(lambda.iam.createRole).toHaveBeenCalled();
      expect(lambda.iam.attachPolicyToRole).toHaveBeenCalledWith(
        "boto3js-lambda-role",
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      );
      // --- FIX: END ---

      expect(waitUntilFunctionActive).toHaveBeenCalled();
    });

    test("deploy should throw a formatted error on failure", async () => {
      lambdaMock.rejects(new Error("InvalidParameterValueException"));
      await expect(lambda.deploy(FUNCTION_NAME, MOCK_CODE)).rejects.toThrow(
        `Lambda deploy(${FUNCTION_NAME}) failed: InvalidParameterValueException`
      );
      expect(waitUntilFunctionActive).not.toHaveBeenCalled();
    });

    test("update should update function code, wait, and return ARN", async () => {
      lambdaMock.resolves({ FunctionArn: MOCK_ARN });
      const newCode = 'exports.handler = () => "new code";';

      const arn = await lambda.update(FUNCTION_NAME, newCode);

      expect(arn).toBe(MOCK_ARN);
      expect(lambdaMock.commandCalls(UpdateFunctionCodeCommand).length).toBe(1);
      expect(
        lambdaMock.commandCalls(UpdateFunctionCodeCommand)[0].args[0].input
          .ZipFile
      ).toBeInstanceOf(Buffer);
      expect(waitUntilFunctionUpdated).toHaveBeenCalledWith(
        { client: lambda.client, maxWaitTime: 180 },
        { FunctionName: FUNCTION_NAME }
      );
    });

    test("update should throw a formatted error on failure", async () => {
      lambdaMock.rejects(new Error("ResourceNotFoundException"));
      await expect(lambda.update(FUNCTION_NAME, MOCK_CODE)).rejects.toThrow(
        `Lambda update(${FUNCTION_NAME}) failed: ResourceNotFoundException`
      );
      expect(waitUntilFunctionUpdated).not.toHaveBeenCalled();
    });

    test("invoke should send payload and return decoded JSON response", async () => {
      const mockPayload = { key: "value" };
      const mockResponse = { statusCode: 200, body: "Success" };
      const responseBuffer = Buffer.from(JSON.stringify(mockResponse));

      lambdaMock.resolves({ Payload: responseBuffer });

      const res = await lambda.invoke(FUNCTION_NAME, mockPayload);

      expect(res).toEqual(mockResponse);
      const sentCommand =
        lambdaMock.commandCalls(InvokeCommand)[0].args[0].input;
      expect(sentCommand.FunctionName).toBe(FUNCTION_NAME);
      expect(JSON.parse(Buffer.from(sentCommand.Payload).toString())).toEqual(
        mockPayload
      );
    });

    test("invoke should return empty object for empty payload", async () => {
      lambdaMock.resolves({ Payload: Buffer.from("") });
      const res = await lambda.invoke(FUNCTION_NAME, {});
      expect(res).toEqual({});
    });

    test("invoke should throw a formatted error on failure", async () => {
      lambdaMock.rejects(new Error("ServiceException"));
      await expect(lambda.invoke(FUNCTION_NAME, {})).rejects.toThrow(
        `Lambda invoke(${FUNCTION_NAME}) failed: ServiceException`
      );
    });

    test("delete should resolve on success", async () => {
      lambdaMock.resolves({ $metadata: { httpStatusCode: 204 } });
      await expect(lambda.delete(FUNCTION_NAME)).resolves.toBeDefined();
      expect(lambdaMock.commandCalls(DeleteFunctionCommand).length).toBe(1);
      expect(
        lambdaMock.commandCalls(DeleteFunctionCommand)[0].args[0].input
          .FunctionName
      ).toBe(FUNCTION_NAME);
    });

    test("delete should throw a formatted error on failure", async () => {
      lambdaMock.rejects(new Error("ResourceNotFoundException"));
      await expect(lambda.delete(FUNCTION_NAME)).rejects.toThrow(
        `Lambda delete(${FUNCTION_NAME}) failed: ResourceNotFoundException`
      );
    });
  });
});
