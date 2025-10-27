# **@shubhvora/boto3-js**

A **boto3 wrapper for AWS SDK** in Node.js — designed to make AWS S3 operations simple and familiar for developers who love the boto3 experience.

(will be working on convertion to typescript)
currently adding
aws lambda

## **🚀 Features**

- Built on top of the official [AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3)
- Automatic credential loading (from environment variables or \~/.aws/credentials)
- Modern, Promise-based async/await API
- Simple pre-signed URL generation
- Optional debug mode for easy inspection

## **📦 Installation**

```js
npm install @shubhvora/boto3-js
```

## **⚙️ Setup & Configuration**

You can configure the client in two ways. The AWS SDK will automatically detect credentials from environment variables (AWS_ACCESS_KEY_ID, etc.) or your shared credentials file.

Usage

## Option 1 — Configure via setup() (runtime override)

You can directly set your AWS region and credentials in code:

```js
import { setup, boto3, AWSService } from "@shubhvora/boto3-js";

// Configure global AWS credentials
setup({
  region: "ap-south-1",
  accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
  secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
});

// Initialize S3 client
const s3 = boto3(AWSService.S3);

// Use your client
await s3.upload("my-bucket", "file.txt", "./file.txt");
```

Great for dynamic runtime configuration or testing multiple environments.

## Option 2 — Use .env (default environment variables)

Create a .env file in your project root:

```
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
```

Then simply import boto3-js — no manual setup required:

```js
import { boto3, AWSService } from "@shubhvora/boto3-js";

// Initialize S3 client (reads from .env automatically)
const s3 = boto3(AWSService.S3);

await s3.upload("my-bucket", "file.txt", "./local/file.txt");
```

Ideal for projects that store secrets in environment files.

## Option 3 — Load environment variables from a custom path

Use loadEnv() if your .env file is somewhere else:

```js
import { loadEnv, boto3, AWSService } from "@shubhvora/boto3-js";

// Load environment variables from any location
loadEnv("/configs/aws/.env.prod");

// Initialize S3 client
const s3 = boto3(AWSService.S3);

await s3.upload("my-bucket", "file.txt", "./local/file.txt");
```

Useful for multi-environment setups or non-root .env files.

.env.example

# Copy this to .env and fill in your credentials

```
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=us-east-1
```

## **☁️ Amazon S3**

### **🧠 S3 Usage Examples**

#### **1️⃣ List Buckets**

```js
const buckets = await s3.listBuckets();
console.log("Buckets:", buckets);
```

#### **2️⃣ Create a New Bucket**

```js
await s3.createBucket("my-awesome-new-bucket-12345");
console.log("Bucket created!");
```

#### **3️⃣ List Objects in a Bucket**

```js
const objects = await s3.listObjects("my-awesome-new-bucket-12345");
console.log("Objects:", objects);
```

#### **4️⃣ Upload a File**

```js
import fs from "fs";

const fileContent = fs.readFileSync("path/to/your/file.txt");
await s3.uploadFile("my-awesome-new-bucket-12345", "file.txt", fileContent);
console.log("File uploaded!");
```

#### **5️⃣ Download a File**

```js
const content = await s3.downloadFile(
  "my-awesome-new-bucket-12345",
  "file.txt"
);
console.log("File content:", content);
```

#### **6️⃣ Delete an Object**

```js
await s3.deleteObject("my-awesome-new-bucket-12345", "file.txt");
console.log("Object deleted!");
```

#### **7️⃣ Copy an Object**

```js
await s3.copyObject(
  "my-awesome-new-bucket-12345",
  "file.txt",
  "my-backup-bucket",
  "file-copy.txt"
);
console.log("Object copied!");
```

#### **8️⃣ Generate a Pre-signed URL for Download**

```js
// Get a URL that expires in 10 minutes (600 seconds)
const url = await s3.getObjectURL(
  "my-awesome-new-bucket-12345",
  "file.txt",
  600
);
console.log("Signed URL:", url);
```

### **🧩 S3 API Reference**

| Method                                             | Description                                     | Example                                              |
| :------------------------------------------------- | :---------------------------------------------- | :--------------------------------------------------- |
| listBuckets()                                      | Lists all S3 buckets in your account.           | await s3.listBuckets()                               |
| createBucket(name)                                 | Creates a new bucket.                           | await s3.createBucket("my-bucket")                   |
| deleteBucket(name)                                 | Deletes an existing bucket.                     | await s3.deleteBucket("my-bucket")                   |
| listObjects(bucket)                                | Lists all objects in a given bucket.            | await s3.listObjects("my-bucket")                    |
| uploadFile(bucket, key, body)                      | Uploads a file (string, Buffer, or Stream).     | await s3.uploadFile("bucket", "key", data)           |
| downloadFile(bucket, key)                          | Downloads file contents as a string.            | await s3.downloadFile("bucket", "key")               |
| deleteObject(bucket, key)                          | Deletes a specific object.                      | await s3.deleteObject("bucket", "key")               |
| copyObject(srcBucket, srcKey, destBucket, destKey) | Copies an object between locations.             | await s3.copyObject("src", "a.txt", "dest", "b.txt") |
| getObjectURL(bucket, key, expiresIn)               | Generates a temporary, pre-signed download URL. | await s3.getObjectURL("bucket", "key", 3600\)        |

## **🗄️ Amazon DynamoDB**

### **🧠 DynamoDB Usage Examples**

#### **1️⃣ Create a Table**

This creates a new table with a partition key. A sort key is optional.

```js
await db.createTable({
  tableName: "Users",
  partitionKey: "id",
});
console.log("Table 'Users' created!");
```

#### **2️⃣ Add or Update an Item (Put)**

putItem will create a new item or overwrite an existing item with the same key.

```js
await db.putItem("Users", {
  id: { S: "1" },
  name: { S: "Vortex" },
  role: { S: "Master" },
});
console.log("Item added!");
```

#### **3️⃣ Get an Item**

Retrieve a single item by its key.

```js
const user = await db.getItem("Users", { id: { S: "1" } });
console.log("Retrieved item:", user);
```

#### **4️⃣ Update an Item**

Atomically update an item's attributes without overwriting the entire item.

```js
const updatedUser = await db.updateItem(
  "Users",
  { id: { S: "1" } }, // Key of the item to update
  { role: { S: "Legend" } } // Attributes to update
);
console.log("Updated item attributes:", updatedUser);
```

#### **5️⃣ Scan a Table**

A scan operation reads every item in a table. Use with caution on large tables.

```js
const allUsers = await db.scan("Users", {});
console.log("All items in table:", allUsers);
```

#### **6️⃣ Query a Table**

More efficient than scan, query finds items based on primary key values.

```js
const params = {
  KeyConditionExpression: "id = :idVal",
  ExpressionAttributeValues: {
    ":idVal": { S: "1" },
  },
};
const results = await db.query("Users", params);
console.log("Query results:", results);
```

#### **7️⃣ Delete an Item**

```js
await db.deleteItem("Users", { id: { S: "1" } });
console.log("Item deleted!");
```

### **🧩 DynamoDB API Reference**

| Method                                      | Description                                                              | Example                                                          |
| :------------------------------------------ | :----------------------------------------------------------------------- | :--------------------------------------------------------------- |
| createTable({tableName, partitionKey, ...}) | Creates a new DynamoDB table.                                            | await db.createTable({ tableName: "T", partitionKey: "id" })     |
| putItem(table, item)                        | Creates or replaces an entire item.                                      | await db.putItem("T", { id: {S: "1"}, ... })                     |
| getItem(table, key)                         | Retrieves an item by its primary key.                                    | await db.getItem("T", { id: {S: "1"} })                          |
| updateItem(table, key, updates)             | Modifies specific attributes of an existing item.                        | await db.updateItem("T", { id: {S: "1"} }, { name: {S: "New"} }) |
| deleteItem(table, key)                      | Deletes a single item by its primary key.                                | await db.deleteItem("T", { id: {S: "1"} })                       |
| query(table, params)                        | Finds items using only primary key attribute values.                     | await db.query("T", { KeyConditionExpression: "id = :v", ... })  |
| scan(table, params)                         | Reads every item in a table or secondary index.                          | await db.scan("T", {})                                           |
| batchWrite(items)                           | Puts or deletes multiple items in one or more tables (up to 25 items).   | await db.batchWrite({ 'Table1': \[...\] })                       |
| transactWrite(transactions)                 | An all-or-nothing operation for writing to multiple items within tables. | await db.transactWrite(\[{ Put: {...} }, { Update: {...} }\])    |

## **🤫 AWS Secrets Manager**

The Secrets Manager client provides a simple interface for the complete lifecycle of your secrets, including creation, retrieval, replication, and deletion.

### **🧠 Secrets Manager Usage Examples**

First, initialize the client:

```js
import { boto3, AWSService } from "@shubhvora/boto3-js";

// Initialize Secrets Manager client

const sm = boto3(AWSService.SECRETMANAGER);
```

#### **1️⃣ Create or Update a Secret**

putSecret will create a new secret or update the value of an existing one. It automatically handles JSON stringification.

JavaScript

```js
const secretName = "my-app/database-credentials";

const secretValue = { user: "admin", pass: "P@ssw0rd123\!" };

await sm.putSecret(secretName, secretValue);

console.log(\`Secret '${secretName}' created/updated\!\`);
```

#### **2️⃣ Get a Secret's Value**

Retrieve and parse the secret's value. It automatically parses JSON strings back into objects.

JavaScript

```js
const credentials = await sm.getSecret("my-app/database-credentials");

console.log("Retrieved username:", credentials.user);
```

#### **3️⃣ Describe a Secret**

Get metadata about a secret, such as its ARN, tags, and replication status.

```js
const details = await sm.describeSecret("my-app/database-credentials");

console.log("Secret ARN:", details.ARN);
```

#### **4️⃣ Replicate a Secret to Other Regions**

Easily replicate a secret to other AWS regions for multi-region applications.

```js
await sm.replicateSecret("my-app/database-credentials", \["us-west-2", "eu-central-1"\]);

console.log("Secret replication initiated\!");
```

#### **5️⃣ List All Secrets**

Retrieve a paginated list of all secrets in the configured region.

```js
const secrets = await sm.listSecrets();

console.log(\`Found ${secrets.SecretList.length} secrets.\`);
```

#### **6️⃣ Delete a Secret Permanently**

This function permanently deletes a secret. It's designed to automatically find and **remove any replicas** first, simplifying the cleanup process.

```js
await sm.deleteSecretPermanent("my-app/database-credentials");

console.log("Secret and all its replicas have been permanently deleted!");
```

### **🧩 Secrets Manager API Reference**

| Method                                | Description                                                | Example                                                |
| :------------------------------------ | :--------------------------------------------------------- | :----------------------------------------------------- |
| getSecret(name)                       | Retrieves the secret value, auto-parsing JSON.             | await sm.getSecret("my/secret")                        |
| putSecret(name, value)                | Creates a new secret or updates an existing one.           | await sm.putSecret("my/secret", {k: "v"})              |
| describeSecret(name)                  | Gets a secret's metadata, tags, and replication info.      | await sm.describeSecret("my/secret")                   |
| listSecrets(limit?)                   | Lists all secrets in the region.                           | await sm.listSecrets()                                 |
| listVersions(name)                    | Lists all versions of a specific secret.                   | await sm.listVersions("my/secret")                     |
| updateSecret(name, params)            | Performs a raw update using AWS SDK parameters.            | await sm.updateSecret("my/secret", {Desc: "..."})      |
| tagSecret(name, tags)                 | Adds key-value tags to a secret.                           | await sm.tagSecret("my/secret", \[{K:"a", V:"b"}\])    |
| untagSecret(name, tagKeys)            | Removes tags from a secret by their keys.                  | await sm.untagSecret("my/secret", \["KeyA"\])          |
| replicateSecret(name, regions)        | Replicates a secret to one or more AWS regions.            | await sm.replicateSecret("my/secret", \["us-west-2"\]) |
| rotateSecret(name, lambdaArn?)        | Initiates rotation for a secret.                           | await sm.rotateSecret("my/secret")                     |
| cancelRotation(name)                  | Disables automatic rotation for a secret.                  | await sm.cancelRotation("my/secret")                   |
| deleteSecretPermanent(name)           | **Permanently deletes a secret and its replicas.**         | await sm.deleteSecretPermanent("my/secret")            |
| deleteSecretWithRecovery(name, days?) | Deletes a secret with a recovery window (default 7 days).  | await sm.deleteSecretWithRecovery("my/secret", 15\)    |
| restoreSecret(name)                   | Restores a secret that was deleted with a recovery window. | await sm.restoreSecret("my/secret")                    |

# **AWS IAM Client 🛡️**

The IAM client provides a simple, modern interface to manage AWS Identity and Access Management (IAM) resources. It supports common operations for IAM roles, users, and policies through a clean, promise-based API, making asynchronous operations intuitive and easy to handle.

## **Setup**

Then, import and initialize the IAM client:

```js
import { boto3, AWSService } from "@shubhvora/boto3-js";

// Initialize the IAM service client
const iam = boto3(AWSService.IAM);
```

## **🧠 IAM Usage Examples**

Here are practical examples demonstrating how to manage IAM Users and Roles.

### **👤 User Management**

#### **1\. Create a User**

Create a new IAM user with a specified username.

```js
try {
  const user = await iam.createUser("new-user");
  console.log("User created successfully:", user);
} catch (error) {
  console.error("Error creating user:", error);
}
```

#### **2\. List Users**

Retrieve a list of all IAM users in your account.

```js
try {
  const users = await iam.listUsers();
  console.log("Available Users:", users);
} catch (error) {
  console.error("Error listing users:", error);
}
```

#### **3\. Get User Details**

Fetch detailed information for a single user.

```js
try {
  const user = await iam.getUser("new-user");
  console.log("User details:", user);
} catch (error) {
  console.error("Error getting user:", error);
}
```

#### **4\. Attach & Detach a User Policy**

Manage user permissions by attaching and detaching IAM policies.

```js
const userName = "new-user";
const policyArn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess";

try {
 // Attach policy
 await iam.attachPolicyToUser(userName, policyArn);
 console.log(\`Policy attached to ${userName}.\`);

// Detach policy
 await iam.detachPolicyFromUser(userName, policyArn);
 console.log(\`Policy detached from ${userName}.\`);
} catch (error) {
 console.error("Error managing user policy:", error);
}
```

#### **5\. List Policies of a User**

List all managed policies attached to a specific user.

```js
try {
  const policies = await iam.listPoliciesOfUser("new-user");
  console.log("Attached policies:", policies);
} catch (error) {
  console.error("Error listing user policies:", error);
}
```

#### **6\. Delete a User**

Remove an IAM user. The client automatically handles detaching any attached policies before deletion.

```js
try {
  await iam.deleteUser("new-user");
  console.log("User deleted successfully!");
} catch (error) {
  console.error("Error deleting user:", error);
}
```

### **🎭 Role Management**

#### **1\. Create a Role**

Create a new IAM role with a trust policy document.

```js
const roleName = "my-new-role";
const assumeRolePolicyDocument = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { Service: "ec2.amazonaws.com" },
      Action: "sts:AssumeRole",
    },
  ],
};

try {
  await iam.createRole(roleName, assumeRolePolicyDocument);
  console.log("Role created successfully!");
} catch (error) {
  console.error("Error creating role:", error);
}
```

#### **2\. List All Roles**

Retrieve a list of all IAM roles in your account.

```js
try {
  const roles = await iam.listRoles();
  console.log("Available Roles:", roles);
} catch (error) {
  console.error("Error listing roles:", error);
}
```

#### **3\. Get Role Details**

Fetch detailed information about a single role.

```js
try {
  const role = await iam.getRole("my-new-role");
  console.log("Role details:", role);
} catch (error) {
  console.error("Error getting role:", error);
}
```

#### **4\. Attach & Detach a Role Policy**

Update role permissions by attaching and detaching policies.

```js
const roleName = "my-new-role";
try {
  await iam.attachPolicyToRole(
    roleName,
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  );
  console.log("DynamoDB policy attached.");

  await iam.detachPolicyFromRole(
    roleName,
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  );
  console.log("DynamoDB policy detached.");
} catch (error) {
  console.error("Error managing role policy:", error);
}
```

#### **5\. List Policies of a Role**

List all managed policies that are attached to a specific role.

```js
try {
  const policies = await iam.listPoliciesOfRole("my-new-role");
  console.log("Attached policies:", policies);
} catch (error) {
  console.error("Error listing role policies:", error);
}
```

#### **6\. Delete a Role**

Remove an IAM role. The client first detaches all attached policies.

```js
try {
  await iam.deleteRole("my-new-role");
  console.log("Role deleted successfully!");
} catch (error) {
  console.error("Error deleting role:", error);
}
```

## **🧩 IAM API Reference**

### **User Management**

| Method                                    | Description                                        | Example                                        |
| :---------------------------------------- | :------------------------------------------------- | :--------------------------------------------- |
| createUser(userName)                      | Creates a new IAM user.                            | await iam.createUser("user")                   |
| deleteUser(userName)                      | Deletes a user (detaches attached policies first). | await iam.deleteUser("user")                   |
| listUsers()                               | Lists all users in the account.                    | await iam.listUsers()                          |
| getUser(userName)                         | Retrieves details for a specific user.             | await iam.getUser("user")                      |
| attachPolicyToUser(userName, policyArn)   | Attaches a managed policy to a user.               | await iam.attachPolicyToUser("user", "pArn")   |
| detachPolicyFromUser(userName, policyArn) | Detaches a managed policy from a user.             | await iam.detachPolicyFromUser("user", "pArn") |
| listPoliciesOfUser(userName)              | Lists all managed policies attached to a user.     | await iam.listPoliciesOfUser("user")           |

### **Role Management**

| Method                                    | Description                                        | Example                                        |
| :---------------------------------------- | :------------------------------------------------- | :--------------------------------------------- |
| createRole(roleName, policyDoc)           | Creates a new IAM role with an assume-role policy. | await iam.createRole("role", {...})            |
| deleteRole(roleName)                      | Deletes a role (detaches attached policies first). | await iam.deleteRole("role")                   |
| listRoles()                               | Lists all roles in the account.                    | await iam.listRoles()                          |
| getRole(roleName)                         | Retrieves details for a specific role.             | await iam.getRole("role")                      |
| attachPolicyToRole(roleName, policyArn)   | Attaches a managed policy to a role.               | await iam.attachPolicyToRole("role", "pArn")   |
| detachPolicyFromRole(roleName, policyArn) | Detaches a managed policy from a role.             | await iam.detachPolicyFromRole("role", "pArn") |
| listPoliciesOfRole(roleName)              | Lists all managed policies attached to a role.     | await iam.listPoliciesOfRole("role")           |

## **⚡ AWS Lambda (SimpleLambda)**

The SimpleLambda class abstracts away the most complex parts of deploying and managing AWS Lambda functions. It automatically handles IAM role creation, in-memory code zipping, and waiting for functions to be in a ready state.

### **🧠 SimpleLambda Usage Examples**

#### **1️⃣ Deploy a New Function**

This is the simplest way to deploy. The deploy method handles everything:

1. Automatically finds or creates the necessary IAM execution role (boto3js-lambda-role).
2. Zips your code string in memory.
3. Creates the Lambda function.
4. **Waits** for the function to be in the Active state before returning, so it's ready to be invoked immediately.

// 1. Define your Lambda handler code as a string

```js
const simpleCode = `
 exports.handler = async (event) => {
    console.log("Event received:", event);
    return {
      statusCode: 200,
      body: JSON.stringify({
      message: "Hello from SimpleLambda\!",
      input: event
    }),
  };
 };
`;
```

// 2. Deploy it!

```js
const arn = await lambda.deploy("my-first-function", simpleCode);
console.log("Function deployed and active!", arn);
```

#### **2️⃣ Deploy with Custom Options**

The deploy method accepts an optional third argument (opts) for all other Lambda settings.

```js
const advancedCode = `
 // This code has a different handler name
  exports.myHandler = async (event) => {
  // ... logic ...
  };
`;
```

```js
const options = {
  runtime: "nodejs20.x",
  handler: "index.myHandler", // Note: The file is always 'index.js'
  timeout: 60, // 60 seconds
  memorySize: 256, // 256 MB
  description: "A function with custom settings",
  roleName: "my-custom-lambda-role", // Optional: Specify a different role name
};

await lambda.deploy("my-advanced-function", advancedCode, options);
console.log("Advanced function deployed!");
```

#### **3️⃣ Invoke a Function**

The invoke method automatically stringifies your payload object and parses the JSON response from the Lambda, making it simple to work with.

```js
const payload = { user: "Vortex", task: "deploy-service" };

// Invoke the function and get the parsed response
const response = await lambda.invoke("my-first-function", payload);

console.log("Lambda response:", response);
/*
Output:
{
 statusCode: 200,
 body: '{"message":"Hello from SimpleLambda\!","input":{"user":"Vortex","task":"deploy-service"}}'
}
\*
```

#### **4️⃣ Update Function Code**

Similar to deploy, the update method zips your new code and **waits** for the update to complete successfully before resolving.

```js
const updatedCode = `
 exports.handler = async (event) => {
 return {
      statusCode: 200,
      body: "This code is new and improved!",
    };
  };
`;

await lambda.update("my-first-function", updatedCode);
console.log("Function code updated and ready!");
```

#### **5️⃣ List All Functions**

This retrieves all Lambda functions in your account and region.

```js
const allFunctions = await lambda.listFunctions();

// Log just the names
console.log(
  "All Function Names:",
  allFunctions.map((f) => f.FunctionName)
);
```

#### **6️⃣ Delete a Function**

This permanently deletes the Lambda function.

```js
await lambda.delete("my-first-function");
console.log("Function deleted!");
```

### **🧩 SimpleLambda API Reference**

| Method                             | Description                                                                                                                                                                                                                      | Example                                                    |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| new SimpleLambda(options, {debug}) | Initializes the client. options are passed to the AWS SDK v3 LambdaClient. {debug: true} enables verbose console logging.                                                                                                        | new SimpleLambda({ region: "us-east-1" }, { debug: true }) |
| deploy(name, code, opts)           | Deploys a new function. **Automatically creates/finds an IAM role** and **zips code in-memory**. **Waits for function to be 'Active'**. opts object can include runtime, handler, timeout, memorySize, description, or roleName. | await lambda.deploy("my-func", codeStr, { timeout: 30 })   |
| update(name, code)                 | Updates an existing function's code. **Zips new code in-memory** and **waits for the update to complete** before resolving.                                                                                                      | await lambda.update("my-func", newCodeStr)                 |
| invoke(name, payload)              | Invokes a function. **Automatically stringifies the payload object** and **parses the JSON response** from the Lambda.                                                                                                           | await lambda.invoke("my-func", { key: "val" })             |
| delete(name)                       | Deletes the specified Lambda function.                                                                                                                                                                                           | await lambda.delete("my-func")                             |
| listFunctions()                    | Lists all Lambda functions in the account. Returns the Functions array directly (or \[\] if empty).                                                                                                                              | await lambda.listFunctions()                               |

## **💬 Error Handling**

All methods are wrapped in try...catch blocks and will throw a descriptive error on failure.

```js
try {
  const data = await s3.downloadFile(
    "non-existent-bucket",
    "imaginary-file.txt"
  );
} catch (err) {
  // Example Error: "S3 downloadFile(non-existent-bucket, imaginary-file.txt) failed: The specified bucket does not exist"
  console.error(err.message);
}
```

## **🧑‍💻 Contributing**

Pull requests are welcome\! If you'd like to contribute, please fork the repository and open a pull request.

1. Fork the repo
2. Create a new branch: git checkout \-b feature/my-new-feature
3. Commit your changes: git commit \-m "Add my new feature"
4. Push to your fork: git push origin feature/my-new-feature
5. Open a Pull Request on GitHub

## **🪪 License**

This project is licensed under the **MIT License**.

## **🌍 Links**

- [**GitHub Repository**](https://github.com/Vortex1806/boto3-js)
- [**NPM Package**](https://www.google.com/search?q=https://www.npmjs.com/package/@shubhvora/boto3-js)

Made with ❤️ by Shubh Vora
