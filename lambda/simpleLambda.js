import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  InvokeCommand,
  DeleteFunctionCommand,
  waitUntilFunctionActive,
  waitUntilFunctionUpdated,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";
import { SimpleIAM } from "../iam/simpleIAM.js";
import { Buffer } from "buffer";
import AdmZip from "adm-zip";

export class SimpleLambda {
  constructor(options = {}, { debug = false } = {}) {
    this.client = new LambdaClient(options);
    this.debug = debug;
    this.iam = new SimpleIAM(options, { debug });
  }

  _formatOutput(data) {
    if (this.debug) console.log(JSON.stringify(data, null, 2));
    return data;
  }

  _handleError(operation, err) {
    throw new Error(`Lambda ${operation} failed: ${err.message}`);
  }

  /**
   * Create in-memory ZIP using uzip.
   * The user provides plain JS code string; we zip it as index.js.
   */
  _createZipBuffer(codeString) {
    const zip = new AdmZip();
    zip.addFile("index.js", Buffer.from(codeString, "utf8"));
    return zip.toBuffer();
  }

  // --- Internal Role Helper ---
  async _getOrCreateRole(roleName = "boto3js-lambda-role") {
    try {
      const role = await this.iam.getRole(roleName);
      if (this.debug) console.log("Using existing Lambda role:", role.Arn);
      return role.Arn;
    } catch {
      const assumePolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      };

      const newRole = await this.iam.createRole(roleName, assumePolicy);
      if (this.debug) console.log("Created new Lambda role:", newRole.Arn);

      await this.iam.attachPolicyToRole(
        roleName,
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      );

      return newRole.Arn;
    }
  }

  // --- Deploy Lambda ---
  async deploy(functionName, codeString, opts = {}) {
    try {
      const roleArn = await this._getOrCreateRole(opts.roleName);
      const zipBuffer = this._createZipBuffer(codeString);

      const res = await this.client.send(
        new CreateFunctionCommand({
          FunctionName: functionName,
          Role: roleArn,
          Handler: opts.handler || "index.handler",
          Runtime: opts.runtime || "nodejs18.x",
          Code: { ZipFile: zipBuffer },
          Description: opts.description || "Created by boto3-js SimpleLambda",
          Timeout: opts.timeout || 10,
          MemorySize: opts.memorySize || 128,
        })
      );

      if (this.debug)
        console.log(`Waiting for function ${functionName} to become Active...`);
      await waitUntilFunctionActive(
        { client: this.client, maxWaitTime: 180 },
        { FunctionName: functionName }
      );
      if (this.debug) console.log("Function is now Active.");

      return this._formatOutput(res.FunctionArn);
    } catch (err) {
      this._handleError(`deploy(${functionName})`, err);
    }
  }

  // --- Update Lambda Code ---
  async update(functionName, codeString) {
    try {
      const zipBuffer = this._createZipBuffer(codeString);
      const res = await this.client.send(
        new UpdateFunctionCodeCommand({
          FunctionName: functionName,
          ZipFile: zipBuffer,
        })
      );
      if (this.debug)
        console.log(
          `Waiting for function ${functionName} update to complete...`
        );
      await waitUntilFunctionUpdated(
        { client: this.client, maxWaitTime: 180 },
        { FunctionName: functionName }
      );
      if (this.debug) console.log("Function update complete.");
      return this._formatOutput(res.FunctionArn);
    } catch (err) {
      this._handleError(`update(${functionName})`, err);
    }
  }

  // --- Invoke Lambda ---
  async invoke(functionName, payload = {}) {
    try {
      const res = await this.client.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify(payload)),
        })
      );

      const decoded =
        res.Payload && res.Payload.length
          ? JSON.parse(Buffer.from(res.Payload).toString())
          : {};

      return this._formatOutput(decoded);
    } catch (err) {
      this._handleError(`invoke(${functionName})`, err);
    }
  }

  // --- Delete Lambda ---
  async delete(functionName) {
    try {
      const res = await this.client.send(
        new DeleteFunctionCommand({ FunctionName: functionName })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`delete(${functionName})`, err);
    }
  }

  // --- List Lambdas ---
  async listFunctions() {
    try {
      const res = await this.client.send(new ListFunctionsCommand({}));
      return this._formatOutput(res.Functions || []);
    } catch (err) {
      this._handleError("listFunctions", err);
    }
  }
}

export default SimpleLambda;
