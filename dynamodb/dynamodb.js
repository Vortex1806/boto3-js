import {
  DynamoDBClient,
  CreateTableCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteItemCommand,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";

export class SimpleDynamoDB {
  constructor(options = {}, { debug = false } = {}) {
    this.client = new DynamoDBClient(options);
    this.debug = debug;
  }

  _formatOutput(data) {
    if (this.debug) console.log(JSON.stringify(data, null, 2));
    return data;
  }

  _handleError(operation, err) {
    throw new Error(`DynamoDB ${operation} failed: ${err.message}`);
  }

  // ------------------------------
  // Table operations
  // ------------------------------
  async createTable({
    tableName,
    partitionKey,
    sortKey = null,
    billingMode = "PAY_PER_REQUEST",
  }) {
    try {
      const attributeDefinitions = [
        { AttributeName: partitionKey, AttributeType: "S" },
      ];
      const keySchema = [{ AttributeName: partitionKey, KeyType: "HASH" }];

      if (sortKey) {
        attributeDefinitions.push({
          AttributeName: sortKey,
          AttributeType: "S",
        });
        keySchema.push({ AttributeName: sortKey, KeyType: "RANGE" });
      }

      const command = new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        BillingMode: billingMode,
      });

      const res = await this.client.send(command);
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`createTable(${tableName})`, err);
    }
  }

  // ------------------------------
  // Item operations
  // ------------------------------
  async putItem(table, item) {
    try {
      const res = await this.client.send(
        new PutItemCommand({ TableName: table, Item: item })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`putItem(${table})`, err);
    }
  }

  async getItem(table, key) {
    try {
      const res = await this.client.send(
        new GetItemCommand({ TableName: table, Key: key })
      );
      return this._formatOutput(res.Item);
    } catch (err) {
      this._handleError(`getItem(${table})`, err);
    }
  }

  async updateItem(table, key, updates) {
    try {
      const updateExpressions = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};

      for (const k in updates) {
        // Map attribute names to safe names
        const safeName = `#${k}`;
        updateExpressions.push(`${safeName} = :${k}`);
        expressionAttributeNames[safeName] = k;
        expressionAttributeValues[`:${k}`] = updates[k];
      }

      const command = new UpdateItemCommand({
        TableName: table,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: "ALL_NEW",
      });

      const res = await this.client.send(command);
      return this._formatOutput(res.Attributes);
    } catch (err) {
      this._handleError(`updateItem(${table})`, err);
    }
  }

  async deleteItem(table, key) {
    try {
      const res = await this.client.send(
        new DeleteItemCommand({ TableName: table, Key: key })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteItem(${table})`, err);
    }
  }

  async query(table, params) {
    try {
      const res = await this.client.send(
        new QueryCommand({ TableName: table, ...params })
      );
      return this._formatOutput(res.Items || []);
    } catch (err) {
      this._handleError(`query(${table})`, err);
    }
  }

  async scan(table, params) {
    try {
      const res = await this.client.send(
        new ScanCommand({ TableName: table, ...params })
      );
      return this._formatOutput(res.Items || []);
    } catch (err) {
      this._handleError(`scan(${table})`, err);
    }
  }

  async batchWrite(items) {
    try {
      const res = await this.client.send(
        new BatchWriteItemCommand({ RequestItems: items })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`batchWrite`, err);
    }
  }

  async transactWrite(transactions) {
    try {
      const res = await this.client.send(
        new TransactWriteItemsCommand({ TransactItems: transactions })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`transactWrite`, err);
    }
  }
}

export default SimpleDynamoDB;
