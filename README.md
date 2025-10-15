# **@shubhvora/boto3-js**

A **Python boto3-style wrapper for AWS SDK v3** in Node.js — designed to make AWS S3 operations simple, elegant, and familiar for developers who love the boto3 experience.

## **🚀 Features**

- Built on top of the official [AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3)
- Automatic credential loading (from environment variables or \~/.aws/credentials)
- Modern, Promise-based async/await API
- Simple pre-signed URL generation
- Optional debug mode for easy inspection

## **📦 Installation**

```
npm install @shubhvora/boto3-js
```

## **⚙️ Setup & Configuration**

You can configure the client in two ways. The AWS SDK will automatically detect credentials from environment variables (AWS_ACCESS_KEY_ID, etc.) or your shared credentials file.

Usage

## Option 1 — Configure via setup() (runtime override)

You can directly set your AWS region and credentials in code:

```
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
await s3.upload("my-bucket", "file.txt", "./local/file.txt");
```

Great for dynamic runtime configuration or testing multiple environments.

## Option 2 — Use .env (default environment variables)

Create a .env file in your project root:

```
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-south-1
```

```
Then simply import boto3-js — no manual setup required:

import { boto3, AWSService } from "@shubhvora/boto3-js";

// Initialize S3 client (reads from .env automatically)
const s3 = boto3(AWSService.S3);

await s3.upload("my-bucket", "file.txt", "./local/file.txt");
```

Ideal for projects that store secrets in environment files.

## Option 3 — Load environment variables from a custom path

Use loadEnv() if your .env file is somewhere else:

```
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

## **🧠 Usage Examples**

### **1️⃣ List Buckets**

```
const buckets = await s3.listBuckets();
console.log("Buckets:", buckets);
```

### **2️⃣ Create a New Bucket**

```
await s3.createBucket("my-awesome-new-bucket-12345");
console.log("Bucket created!");
```

### **3️⃣ List Objects in a Bucket**

```
const objects = await s3.listObjects("my-awesome-new-bucket-12345");
console.log("Objects:", objects);
```

### **4️⃣ Upload a File**

```
import fs from "fs";

const fileContent = fs.readFileSync("path/to/your/file.txt");
await s3.uploadFile("my-awesome-new-bucket-12345", "file.txt", fileContent);
console.log("File uploaded!");
```

### **5️⃣ Download a File**

```
const content = await s3.downloadFile("my-awesome-new-bucket-12345", "file.txt");
console.log("File content:", content);
```

### **6️⃣ Delete an Object**

```
await s3.deleteObject("my-awesome-new-bucket-12345", "file.txt");
console.log("Object deleted!");
```

### **7️⃣ Copy an Object**

```
await s3.copyObject(
  "my-awesome-new-bucket-12345",
  "file.txt",
  "my-backup-bucket",
  "file-copy.txt"
);
console.log("Object copied!");
```

### **8️⃣ Generate a Pre-signed URL for Download**

```
// Get a URL that expires in 10 minutes (600 seconds)
const url = await s3.getObjectURL("my-awesome-new-bucket-12345", "file.txt", 600);
console.log("Signed URL:", url);
```

## **🧩 API Reference**

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

## **💬 Error Handling**

All methods are wrapped in try...catch blocks and will throw a descriptive error on failure.

```
try {
  const data = await s3.downloadFile("non-existent-bucket", "imaginary-file.txt");
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
