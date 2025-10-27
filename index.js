import dotenv from "dotenv";
import { AWSService } from "./services/service.js";
import SimpleS3 from "./s3/s3.js";
import SimpleDynamoDB from "./dynamodb/dynamodb.js";
import SimpleSecret from "./secretManager/simpleSecret.js";
import SimpleIAM from "./iam/simpleIAM.js";
import SimpleLambda from "./lambda/simpleLambda.js";

// ------------------------------
// Global config
// ------------------------------
dotenv.config();

let globalConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
};

/**
 * Load environment variables from .env (default) or custom path
 * Example: loadEnv("/path/to/custom.env");
 */
export function loadEnv(path = ".env") {
  dotenv.config({ path });

  globalConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
  };

  if (!globalConfig.accessKeyId || !globalConfig.secretAccessKey) {
    throw new Error(
      "[boto3-js] AWS credentials missing in environment. Please add .env or use setup()"
    );
  }

  console.log(`[boto3-js] Environment loaded from ${path}`);
}

// ------------------------------
// Override global config programmatically
// ------------------------------
export function setup(config = {}) {
  globalConfig = { ...globalConfig, ...config };

  if (!globalConfig.accessKeyId || !globalConfig.secretAccessKey) {
    throw new Error(
      "[boto3-js] AWS credentials missing after setup. Please provide accessKeyId and secretAccessKey"
    );
  }

  console.log("[boto3-js] Global config updated:", globalConfig);
}

// ------------------------------
// Initialize AWS service client
// Supports per-call overrides
// ------------------------------
export function boto3(service, options = {}) {
  const mergedOptions = { ...globalConfig, ...options };

  if (!mergedOptions.accessKeyId || !mergedOptions.secretAccessKey) {
    throw new Error(
      "[boto3-js] AWS credentials missing. Call loadEnv() or setup() first."
    );
  }

  // AWS SDK v3 expects credentials inside a "credentials" object
  const sdkConfig = {
    region: mergedOptions.region,
    credentials: {
      accessKeyId: mergedOptions.accessKeyId,
      secretAccessKey: mergedOptions.secretAccessKey,
    },
  };

  switch (service) {
    case AWSService.S3:
      return new SimpleS3(sdkConfig);

    case AWSService.DYNAMODB:
      return new SimpleDynamoDB(sdkConfig);

    case AWSService.SECRETMANAGER:
      return new SimpleSecret(sdkConfig);

    case AWSService.IAM:
      return new SimpleIAM(sdkConfig);

    case AWSService.LAMBDA:
      return new SimpleLambda(sdkConfig);

    default:
      throw new Error(`Service '${service}' is not supported yet.`);
  }
}

export { AWSService };
