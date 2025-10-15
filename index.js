import dotenv from "dotenv";
import AWSService from "./services/service.js";
import SimpleS3 from "./s3/s3.js";
// import SimpleDynamoDB from "./dynamodb/dynamodb.js"; // future module

/**
 * ✅ Load environment variables automatically
 *    Example: loadEnv("/path/to/custom.env");
 */
export function loadEnv(path = ".env") {
  dotenv.config({ path });
  console.log(`[boto3-js] Environment loaded from ${path}`);
}

/**
 * ✅ Global AWS configuration (auto-loaded from env)
 */
let globalConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
};

/**
 * ✅ setup(): Override or extend global AWS configuration at runtime
 *    Example: setup({ region: "ap-south-1" });
 */
export function setup(config = {}) {
  globalConfig = { ...globalConfig, ...config };
  console.log("[boto3-js] Global config updated:", globalConfig);
}

/**
 * ✅ boto3(): Initialize an AWS service client dynamically
 *    Example: const s3 = boto3(AWSService.S3);
 */
export function boto3(service, options = {}) {
  const mergedOptions = { ...globalConfig, ...options };

  switch (service) {
    case AWSService.S3:
      return new SimpleS3(mergedOptions);

    // case AWSService.DYNAMODB:
    //   return new SimpleDynamoDB(mergedOptions);

    default:
      throw new Error(`Service '${service}' is not supported yet.`);
  }
}

export { AWSService };
