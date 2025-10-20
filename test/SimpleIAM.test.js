import {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  GetRoleCommand,
  ListRolesCommand,
  DeleteRoleCommand,
  CreateUserCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  DeleteUserCommand,
  ListAttachedRolePoliciesCommand,
  ListAttachedUserPoliciesCommand,
} from "@aws-sdk/client-iam";
import { mockClient } from "aws-sdk-client-mock";
import SimpleIAM from "../iam/simpleIAM.js";

const iamMock = mockClient(IAMClient);

// Persistent mocks for ListAttachedRolePolicies & ListAttachedUserPolicies
iamMock.on(ListAttachedRolePoliciesCommand).resolves({
  AttachedPolicies: [{ PolicyArn: "arn:aws:iam::aws:policy/Admin" }],
});

iamMock.on(ListAttachedUserPoliciesCommand).resolves({
  AttachedPolicies: [{ PolicyArn: "arn:aws:iam::aws:policy/Admin" }],
});

describe("SimpleIAM", () => {
  let iam;

  beforeEach(() => {
    iamMock.resetHistory();
    iam = new SimpleIAM({}, { debug: false });
  });

  // -------------------------
  // Role operations
  // -------------------------
  test("createRole should call CreateRoleCommand and attach policies", async () => {
    iamMock.on(CreateRoleCommand).resolves({ Role: { RoleName: "test-role" } });
    iamMock.on(AttachRolePolicyCommand).resolves({});

    const role = await iam.createRole("test-role", { Statement: [] });
    await iam.attachPolicyToRole("test-role", "arn:aws:iam::aws:policy/Admin");

    expect(role.RoleName).toBe("test-role");
    expect(iamMock.commandCalls(CreateRoleCommand).length).toBe(1);
    expect(iamMock.commandCalls(AttachRolePolicyCommand).length).toBe(1);
  });

  test("getRole should return the role", async () => {
    iamMock.on(GetRoleCommand).resolves({ Role: { RoleName: "fetched-role" } });
    const role = await iam.getRole("fetched-role");
    expect(role.RoleName).toBe("fetched-role");
  });

  test("listRoles should return roles array", async () => {
    iamMock
      .on(ListRolesCommand)
      .resolves({ Roles: [{ RoleName: "r1" }, { RoleName: "r2" }] });
    const roles = await iam.listRoles();
    expect(roles.length).toBe(2);
    expect(roles[0].RoleName).toBe("r1");
  });

  test("attachPolicyToRole and detachPolicyFromRole", async () => {
    iamMock.on(AttachRolePolicyCommand).resolves({});
    iamMock.on(DetachRolePolicyCommand).resolves({});

    const attachRes = await iam.attachPolicyToRole(
      "test-role",
      "arn:aws:iam::policy"
    );
    expect(attachRes).toBeDefined();

    const detachRes = await iam.detachPolicyFromRole(
      "test-role",
      "arn:aws:iam::policy"
    );
    expect(detachRes).toBeDefined();
  });

  test("deleteRole should call DeleteRoleCommand", async () => {
    iamMock.on(DeleteRoleCommand).resolves({});
    const res = await iam.deleteRole("test-role");
    expect(res).toBeDefined();
  });

  // -------------------------
  // User operations
  // -------------------------
  test("createUser should call CreateUserCommand", async () => {
    iamMock.on(CreateUserCommand).resolves({ User: { UserName: "test-user" } });
    const user = await iam.createUser("test-user");
    expect(user.UserName).toBe("test-user");
  });

  test("attachPolicyToUser and detachPolicyFromUser", async () => {
    iamMock.on(AttachUserPolicyCommand).resolves({});
    iamMock.on(DetachUserPolicyCommand).resolves({});

    const attachRes = await iam.attachPolicyToUser(
      "test-user",
      "arn:aws:iam::policy"
    );
    expect(attachRes).toBeDefined();

    const detachRes = await iam.detachPolicyFromUser(
      "test-user",
      "arn:aws:iam::policy"
    );
    expect(detachRes).toBeDefined();
  });

  test("deleteUser should call DeleteUserCommand", async () => {
    iamMock.on(DeleteUserCommand).resolves({});
    const res = await iam.deleteUser("test-user");
    expect(res).toBeDefined();
  });

  // -------------------------
  // Error handling
  // -------------------------
  test("should throw error if IAM command fails", async () => {
    iamMock.on(CreateRoleCommand).rejects(new Error("AccessDenied"));

    await expect(
      iam.createRole("fail-role", { Statement: [] })
    ).rejects.toThrow("IAM createRole(fail-role) failed: AccessDenied");
  });
});
