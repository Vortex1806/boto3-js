import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";
import { SimpleSecret } from "../secretManager/simpleSecret.js"; // Adjust the path to your SimpleSecret class

// Mock the SecretsManagerClient
const smMock = mockClient(SecretsManagerClient);

describe("SimpleSecret", () => {
  let sm;
  const SECRET_NAME = "test-secret";
  const SECRET_VALUE_STRING = "this is a plain secret";
  const SECRET_VALUE_OBJECT = { user: "test", pass: "123" };

  beforeEach(() => {
    smMock.reset();
    sm = new SimpleSecret();
  });

  describe("Constructor and Debugging", () => {
    test("should initialize without crashing", () => {
      expect(sm).toBeInstanceOf(SimpleSecret);
      expect(sm.client).toBeInstanceOf(SecretsManagerClient);
    });

    test("should log output when debug is enabled", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const smDebug = new SimpleSecret({}, { debug: true });
      smMock.resolves({}); // Mock a generic successful response

      await smDebug.listSecrets();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Core Secret Operations", () => {
    test("getSecret should return a parsed JSON object", async () => {
      smMock.on(GetSecretValueCommand).resolves({
        SecretString: JSON.stringify(SECRET_VALUE_OBJECT),
      });
      const secret = await sm.getSecret(SECRET_NAME);
      expect(secret).toEqual(SECRET_VALUE_OBJECT);
    });

    test("getSecret should return a plain string if not JSON", async () => {
      smMock.on(GetSecretValueCommand).resolves({
        SecretString: SECRET_VALUE_STRING,
      });
      const secret = await sm.getSecret(SECRET_NAME);
      expect(secret).toBe(SECRET_VALUE_STRING);
    });

    test("getSecret should throw a formatted error on failure", async () => {
      smMock.rejects(new Error("Secret not found"));
      await expect(sm.getSecret(SECRET_NAME)).rejects.toThrow(
        `SecretsManager getSecret(${SECRET_NAME}) failed: Secret not found`
      );
    });

    test("putSecret should create a new secret if it does not exist", async () => {
      // First call to getSecret fails, triggering a create
      smMock.on(GetSecretValueCommand).rejectsOnce(new Error("NotFound"));
      // The create call succeeds
      smMock.resolves({ ARN: "arn:aws:secretsmanager:..." });

      const result = await sm.putSecret(SECRET_NAME, SECRET_VALUE_OBJECT);
      expect(result).toHaveProperty("ARN");
    });

    test("putSecret should update an existing secret", async () => {
      // First call to getSecret succeeds, triggering an update
      smMock.on(GetSecretValueCommand).resolvesOnce({ SecretString: "{}" });
      // The update call succeeds
      smMock.resolves({ VersionId: "new-version-id" });

      const result = await sm.putSecret(SECRET_NAME, SECRET_VALUE_OBJECT);
      expect(result).toHaveProperty("VersionId");
    });

    test("describeSecret should return secret metadata", async () => {
      const mockDescription = {
        ARN: "arn:aws:secretsmanager:...",
        Name: SECRET_NAME,
      };
      smMock.resolves(mockDescription);
      const description = await sm.describeSecret(SECRET_NAME);
      expect(description).toEqual(mockDescription);
    });

    test("listSecrets should return a list of secrets", async () => {
      const mockList = {
        SecretList: [{ Name: "secret1" }, { Name: "secret2" }],
      };
      smMock.resolves(mockList);
      const list = await sm.listSecrets();
      expect(list).toEqual(mockList);
    });
  });

  describe("Replication and Deletion", () => {
    test("replicateSecret should resolve on success", async () => {
      const mockResponse = { ARN: "arn:::", ReplicationStatus: [] };
      smMock.resolves(mockResponse);
      const result = await sm.replicateSecret(SECRET_NAME, ["us-west-2"]);
      expect(result).toEqual(mockResponse);
    });

    test("deleteSecretPermanent should succeed for a secret with no replicas", async () => {
      // Mock the replica check (describeSecret)
      smMock
        .on(DescribeSecretCommand)
        .resolves({ ARN: "arn:::", Name: SECRET_NAME, ReplicaRegions: [] });
      // Mock the final deletion
      smMock.on(DeleteSecretCommand).resolves({ DeletionDate: new Date() });

      const result = await sm.deleteSecretPermanent(SECRET_NAME);
      expect(result).toHaveProperty("DeletionDate");
    });

    test("deleteSecretPermanent should remove replicas before deleting", async () => {
      const replicaInfo = {
        Region: "us-west-2",
        KmsKeyId: "kms-key",
        Status: "InSync",
      };

      // 1. First describe call finds replicas
      smMock
        .on(DescribeSecretCommand)
        .resolvesOnce({
          ARN: "arn:::",
          Name: SECRET_NAME,
          ReplicaRegions: [replicaInfo],
        });
      // 2. The update call to remove replicas succeeds
      smMock.on(UpdateSecretCommand).resolvesOnce({});
      // 3. Polling: the next describe call shows no replicas
      smMock
        .on(DescribeSecretCommand)
        .resolvesOnce({ ARN: "arn:::", Name: SECRET_NAME, ReplicaRegions: [] });
      // 4. Final deletion succeeds
      smMock.on(DeleteSecretCommand).resolvesOnce({ DeletionDate: new Date() });

      const result = await sm.deleteSecretPermanent(SECRET_NAME);
      expect(result).toHaveProperty("DeletionDate");
    });

    test("deleteSecretWithRecovery should call removeReplicas then delete", async () => {
      // Mock for removeReplicas part (describeSecret)
      smMock
        .on(DescribeSecretCommand)
        .resolves({ ARN: "arn:::", Name: SECRET_NAME, ReplicaRegions: [] });
      // Mock for the delete command itself
      smMock.on(DeleteSecretCommand).resolves({ DeletionDate: new Date() });

      const result = await sm.deleteSecretWithRecovery(SECRET_NAME, 10);
      expect(result).toHaveProperty("DeletionDate");
    });

    test("restoreSecret should resolve on success", async () => {
      const mockResponse = { ARN: "arn:::", Name: SECRET_NAME };
      smMock.resolves(mockResponse);
      const result = await sm.restoreSecret(SECRET_NAME);
      expect(result).toEqual(mockResponse);
    });
  });
});
