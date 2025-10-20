import {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  DeleteRoleCommand,
  GetRoleCommand,
  ListRolesCommand,
  CreateUserCommand,
  DeleteUserCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  ListAttachedUserPoliciesCommand,
  GetUserCommand,
  ListUsersCommand,
} from "@aws-sdk/client-iam";

export class SimpleIAM {
  constructor(options = {}, { debug = false } = {}) {
    this.client = new IAMClient(options);
    this.debug = debug;
  }

  _formatOutput(data) {
    if (this.debug) console.log(JSON.stringify(data, null, 2));
    return data;
  }

  _handleError(operation, err) {
    throw new Error(`IAM ${operation} failed: ${err.message}`);
  }

  // --- Role Management ---
  async createRole(roleName, assumeRolePolicyDocument) {
    try {
      const res = await this.client.send(
        new CreateRoleCommand({
          RoleName: roleName,
          AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument),
        })
      );
      return this._formatOutput(res.Role);
    } catch (err) {
      this._handleError(`createRole(${roleName})`, err);
    }
  }

  async deleteRole(roleName) {
    try {
      const attached = await this.listPoliciesOfRole(roleName);
      for (const policy of attached) {
        await this.detachPolicyFromRole(roleName, policy.PolicyArn);
      }

      const res = await this.client.send(
        new DeleteRoleCommand({ RoleName: roleName })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteRole(${roleName})`, err);
    }
  }

  async attachPolicyToRole(roleName, policyArn) {
    try {
      const res = await this.client.send(
        new AttachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: policyArn,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`attachPolicyToRole(${roleName}, ${policyArn})`, err);
    }
  }

  async detachPolicyFromRole(roleName, policyArn) {
    try {
      const res = await this.client.send(
        new DetachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: policyArn,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`detachPolicyFromRole(${roleName}, ${policyArn})`, err);
    }
  }

  async listPoliciesOfRole(roleName) {
    try {
      const res = await this.client.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      return this._formatOutput(res.AttachedPolicies || []);
    } catch (err) {
      this._handleError(`listPoliciesOfRole(${roleName})`, err);
    }
  }

  async getRole(roleName) {
    try {
      const res = await this.client.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      return this._formatOutput(res.Role);
    } catch (err) {
      this._handleError(`getRole(${roleName})`, err);
    }
  }

  async listRoles() {
    try {
      const res = await this.client.send(new ListRolesCommand({}));
      return this._formatOutput(res.Roles || []);
    } catch (err) {
      this._handleError("listRoles", err);
    }
  }

  // --- User Management ---
  async createUser(userName) {
    try {
      const res = await this.client.send(
        new CreateUserCommand({ UserName: userName })
      );
      return this._formatOutput(res.User);
    } catch (err) {
      this._handleError(`createUser(${userName})`, err);
    }
  }

  async deleteUser(userName) {
    try {
      const attached = await this.listPoliciesOfUser(userName);
      for (const policy of attached) {
        await this.detachPolicyFromUser(userName, policy.PolicyArn);
      }

      const res = await this.client.send(
        new DeleteUserCommand({ UserName: userName })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteUser(${userName})`, err);
    }
  }

  async attachPolicyToUser(userName, policyArn) {
    try {
      const res = await this.client.send(
        new AttachUserPolicyCommand({
          UserName: userName,
          PolicyArn: policyArn,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`attachPolicyToUser(${userName}, ${policyArn})`, err);
    }
  }

  async detachPolicyFromUser(userName, policyArn) {
    try {
      const res = await this.client.send(
        new DetachUserPolicyCommand({
          UserName: userName,
          PolicyArn: policyArn,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`detachPolicyFromUser(${userName}, ${policyArn})`, err);
    }
  }

  async listPoliciesOfUser(userName) {
    try {
      const res = await this.client.send(
        new ListAttachedUserPoliciesCommand({ UserName: userName })
      );
      return this._formatOutput(res.AttachedPolicies || []);
    } catch (err) {
      this._handleError(`listPoliciesOfUser(${userName})`, err);
    }
  }

  async getUser(userName) {
    try {
      const res = await this.client.send(
        new GetUserCommand({ UserName: userName })
      );
      return this._formatOutput(res.User);
    } catch (err) {
      this._handleError(`getUser(${userName})`, err);
    }
  }

  async listUsers() {
    try {
      const res = await this.client.send(new ListUsersCommand({}));
      return this._formatOutput(res.Users || []);
    } catch (err) {
      this._handleError("listUsers", err);
    }
  }
}

export default SimpleIAM;
