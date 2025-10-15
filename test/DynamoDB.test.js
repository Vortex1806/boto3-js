import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import SimpleDynamoDB from "../dynamodb/dynamodb.js";

const dbMock = mockClient(DynamoDBClient);

describe("SimpleDynamoDB", () => {
  let db;
  const TABLE_NAME = "Users";
  const ITEM = { id: { S: "1" }, name: { S: "Vortex" }, role: { S: "Master" } };

  beforeEach(() => {
    dbMock.reset();
    db = new SimpleDynamoDB({}, { debug: false });
  });

  describe("Table Operations", () => {
    test("createTable should succeed", async () => {
      dbMock.resolves({ TableDescription: { TableName: TABLE_NAME } });
      const result = await db.createTable({
        tableName: TABLE_NAME,
        partitionKey: "id",
      });
      expect(result.TableDescription.TableName).toBe(TABLE_NAME);
    });

    test("createTable should throw formatted error on failure", async () => {
      dbMock.rejects(new Error("Access Denied"));
      await expect(
        db.createTable({ tableName: TABLE_NAME, partitionKey: "id" })
      ).rejects.toThrow(
        `DynamoDB createTable(${TABLE_NAME}) failed: Access Denied`
      );
    });
  });

  describe("Item Operations", () => {
    test("putItem should succeed", async () => {
      dbMock.resolves({});
      const res = await db.putItem(TABLE_NAME, ITEM);
      expect(res).toEqual({});
    });

    test("getItem should return item", async () => {
      dbMock.resolves({ Item: ITEM });
      const res = await db.getItem(TABLE_NAME, { id: { S: "1" } });
      expect(res).toEqual(ITEM);
    });

    test("updateItem should succeed using reserved keyword safely", async () => {
      const updatedItem = { ...ITEM, role: { S: "Legend" } };
      dbMock.resolves({ Attributes: updatedItem });
      const res = await db.updateItem(
        TABLE_NAME,
        { id: { S: "1" } },
        {
          role: { S: "Legend" },
        }
      );
      expect(res).toEqual(updatedItem);
    });

    test("deleteItem should succeed", async () => {
      dbMock.resolves({});
      await expect(
        db.deleteItem(TABLE_NAME, { id: { S: "1" } })
      ).resolves.toBeDefined();
    });

    test("query should return items", async () => {
      dbMock.resolves({ Items: [ITEM] });
      const res = await db.query(TABLE_NAME, {
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": { S: "1" } },
      });
      expect(res).toEqual([ITEM]);
    });

    test("scan should return items", async () => {
      dbMock.resolves({ Items: [ITEM] });
      const res = await db.scan(TABLE_NAME, {});
      expect(res).toEqual([ITEM]);
    });

    test("batchWrite should succeed", async () => {
      dbMock.resolves({});
      const res = await db.batchWrite({
        [TABLE_NAME]: [{ PutRequest: { Item: ITEM } }],
      });
      expect(res).toEqual({});
    });

    test("transactWrite should succeed", async () => {
      dbMock.resolves({});
      const res = await db.transactWrite([
        { Put: { TableName: TABLE_NAME, Item: ITEM } },
      ]);
      expect(res).toEqual({});
    });
  });
});
