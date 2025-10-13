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

You can also specify credentials and region globally:

```
import { setup, boto3 } from "@shubhvora/boto3-js";
import dotenv from "dotenv";

dotenv.config(); // Loads .env file

// Global setup (optional, but recommended)
setup({
  region: process.env.AWS\_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS\_ACCESS\_KEY\_ID,
    secretAccessKey: process.env.AWS\_SECRET\_ACCESS\_KEY,
  },
});

// Get a service client
const s3 \= boto3("s3");

// Or get a client with instance-specific config
const s3\_eu \= boto3("s3", { region: "eu-west-1" });
```

## **🧠 Usage Examples**

### **1️⃣ List Buckets**

```
const buckets \= await s3.list\_buckets();
console.log("Buckets:", buckets);
```

### **2️⃣ Create a New Bucket**

```
await s3.create\_bucket("my-awesome-new-bucket-12345");
console.log("Bucket created\!");
```

### **3️⃣ List Objects in a Bucket**

```
const objects \= await s3.list\_objects("my-awesome-new-bucket-12345");
console.log("Objects:", objects);
```

### **4️⃣ Upload a File**

```
import fs from "fs";

const fileContent \= fs.readFileSync("path/to/your/file.txt");
await s3.upload\_file("my-awesome-new-bucket-12345", "file.txt", fileContent);
console.log("File uploaded\!");
```

### **5️⃣ Download a File**

```
const content \= await s3.download\_file("my-awesome-new-bucket-12345", "file.txt");
console.log("File content:", content);
```

### **6️⃣ Delete an Object**

```
await s3.delete\_object("my-awesome-new-bucket-12345", "file.txt");
console.log("Object deleted\!");
```

### **7️⃣ Copy an Object**

```
await s3.copy\_object(
  "my-awesome-new-bucket-12345",
  "file.txt",
  "my-backup-bucket",
  "file-copy.txt"
);
console.log("Object copied\!");
```

### **8️⃣ Generate a Pre-signed URL for Download**

```
// Get a URL that expires in 10 minutes (600 seconds)
const url \= await s3.get\_object\_url("my-awesome-new-bucket-12345", "file.txt", 600);
console.log("Signed URL:", url);
```

## **🧩 API Reference**

| Method                                              | Description                                     | Example                                               |
| :-------------------------------------------------- | :---------------------------------------------- | :---------------------------------------------------- |
| list_buckets()                                      | Lists all S3 buckets in your account.           | await s3.list_buckets()                               |
| create_bucket(name)                                 | Creates a new bucket.                           | await s3.create_bucket("my-bucket")                   |
| delete_bucket(name)                                 | Deletes an existing bucket.                     | await s3.delete_bucket("my-bucket")                   |
| list_objects(bucket)                                | Lists all objects in a given bucket.            | await s3.list_objects("my-bucket")                    |
| upload_file(bucket, key, body)                      | Uploads a file (string, Buffer, or Stream).     | await s3.upload_file("bucket", "key", data)           |
| download_file(bucket, key)                          | Downloads file contents as a string.            | await s3.download_file("bucket", "key")               |
| delete_object(bucket, key)                          | Deletes a specific object.                      | await s3.delete_object("bucket", "key")               |
| copy_object(srcBucket, srcKey, destBucket, destKey) | Copies an object between locations.             | await s3.copy_object("src", "a.txt", "dest", "b.txt") |
| get_object_url(bucket, key, expiresIn)              | Generates a temporary, pre-signed download URL. | await s3.get_object_url("bucket", "key", 3600\)       |

## **💬 Error Handling**

All methods are wrapped in try...catch blocks and will throw a descriptive error on failure.

```
try {
  const data \= await s3.download\_file("non-existent-bucket", "imaginary-file.txt");
} catch (err) {
  // Example Error: "S3 download\_file(non-existent-bucket, imaginary-file.txt) failed: The specified bucket does not exist"
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

\<p align="center"\>  
Made with ❤️ by Shubh Vora  
\</p\>
