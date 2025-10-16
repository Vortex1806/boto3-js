import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  PutSecretValueCommand,
  DeleteSecretCommand,
  RotateSecretCommand,
  ListSecretsCommand,
  DescribeSecretCommand,
  RestoreSecretCommand,
  UpdateSecretCommand,
  CancelRotateSecretCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListSecretVersionIdsCommand,
  ReplicateSecretToRegionsCommand,
} from "@aws-sdk/client-secrets-manager";

export class SimpleSecret {
  constructor(options = {}, { debug = false } = {}) {
    this.client = new SecretsManagerClient(options);
    this.debug = debug;
  }

  _log(data) {
    if (this.debug) console.log(JSON.stringify(data, null, 2));
  }

  _handleError(operation, err) {
    throw new Error(`SecretsManager ${operation} failed: ${err.message}`);
  }

  _formatOutput(data) {
    this._log(data);
    return data;
  }

  // ---- Core Secret Operations ----

  async getSecret(name) {
    try {
      const res = await this.client.send(
        new GetSecretValueCommand({ SecretId: name })
      );
      let val = res.SecretString;
      try {
        return this._formatOutput(JSON.parse(val));
      } catch {
        return this._formatOutput(val);
      }
    } catch (err) {
      this._handleError(`getSecret(${name})`, err);
    }
  }

  async putSecret(name, value) {
    const secretValue =
      typeof value === "object" ? JSON.stringify(value) : value;
    try {
      // Try update first
      try {
        await this.getSecret(name);
        const res = await this.client.send(
          new PutSecretValueCommand({
            SecretId: name,
            SecretString: secretValue,
          })
        );
        return this._formatOutput(res);
      } catch {
        const res = await this.client.send(
          new CreateSecretCommand({ Name: name, SecretString: secretValue })
        );
        return this._formatOutput(res);
      }
    } catch (err) {
      this._handleError(`putSecret(${name})`, err);
    }
  }

  async rotateSecret(name, lambdaArn) {
    try {
      const params = { SecretId: name };
      if (lambdaArn) params.RotationLambdaARN = lambdaArn;
      const res = await this.client.send(new RotateSecretCommand(params));
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`rotateSecret(${name})`, err);
    }
  }

  async cancelRotation(name) {
    try {
      const res = await this.client.send(
        new CancelRotateSecretCommand({ SecretId: name })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`cancelRotation(${name})`, err);
    }
  }

  async describeSecret(name) {
    try {
      const res = await this.client.send(
        new DescribeSecretCommand({ SecretId: name })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`describeSecret(${name})`, err);
    }
  }

  async listSecrets(limit = 50, nextToken = null) {
    try {
      const res = await this.client.send(
        new ListSecretsCommand({
          MaxResults: limit,
          NextToken: nextToken || undefined,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError("listSecrets", err);
    }
  }

  async listVersions(name) {
    try {
      const res = await this.client.send(
        new ListSecretVersionIdsCommand({ SecretId: name })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`listVersions(${name})`, err);
    }
  }

  async updateSecret(name, params = {}) {
    try {
      const res = await this.client.send(
        new UpdateSecretCommand({ SecretId: name, ...params })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`updateSecret(${name})`, err);
    }
  }

  // ---- Tags ----

  async tagSecret(name, tags = []) {
    try {
      const res = await this.client.send(
        new TagResourceCommand({ SecretId: name, Tags: tags })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`tagSecret(${name})`, err);
    }
  }

  async untagSecret(name, tagKeys = []) {
    try {
      const res = await this.client.send(
        new UntagResourceCommand({ SecretId: name, TagKeys: tagKeys })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`untagSecret(${name})`, err);
    }
  }

  // ---- Cross-Region ----

  async replicateSecret(name, regions = []) {
    try {
      const res = await this.client.send(
        new ReplicateSecretToRegionsCommand({
          SecretId: name,
          AddReplicaRegions: regions.map((region) => ({ Region: region })),
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`replicateSecret(${name})`, err);
    }
  }

  // ---- Delete ----

  async removeReplicas(name, regions = [], timeout = 60000) {
    try {
      if (!regions.length) {
        const desc = await this.describeSecret(name);
        regions = desc.ReplicaRegions?.map((r) => r.Region) || [];
      }
      if (!regions.length)
        return this._formatOutput({ message: "No replicas found" });

      await this.client.send(
        new UpdateSecretCommand({
          SecretId: name,
          RemoveReplicaRegions: regions.map((region) => ({ Region: region })),
        })
      );

      // Poll until replicas are gone
      const start = Date.now();
      while (true) {
        const desc = await this.describeSecret(name);
        if (!desc.ReplicaRegions || desc.ReplicaRegions.length === 0) break;
        if (Date.now() - start > timeout)
          throw new Error("Replica removal timed out");
        await new Promise((r) => setTimeout(r, 3000));
      }

      return this._formatOutput({ message: "Replicas removed successfully" });
    } catch (err) {
      this._handleError(`removeReplicas(${name})`, err);
    }
  }

  async deleteSecretPermanent(name) {
    try {
      await this.removeReplicas(name);
      const res = await this.client.send(
        new DeleteSecretCommand({
          SecretId: name,
          ForceDeleteWithoutRecovery: true,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteSecretPermanent(${name})`, err);
    }
  }

  async deleteSecretWithRecovery(name, days = 7) {
    try {
      // Ensure replicas are removed first
      await this.removeReplicas(name);
      const res = await this.client.send(
        new DeleteSecretCommand({ SecretId: name, RecoveryWindowInDays: days })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteSecretWithRecovery(${name})`, err);
    }
  }

  async restoreSecret(name) {
    try {
      const res = await this.client.send(
        new RestoreSecretCommand({ SecretId: name })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`restoreSecret(${name})`, err);
    }
  }
}

export default SimpleSecret;
