import dotenv from "dotenv";
import SimpleS3 from "./s3/s3.js";

/**
 * ✅ Load environment variables automatically
 * You can also use a custom path:
 *   loadEnv("/path/to/custom.env");
 */
export function loadEnv(path = ".env") {
  dotenv.config({ path });
  console.log(`[boto3-js] Environment loaded from ${path}`);
}

/**
 * ✅ Initialize default configuration using environment variables
 * These can be overridden later using setup()
 */
let globalConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
};

/**
 * ✅ setup(): Override or extend global AWS configuration at runtime
 */
export function setup(config = {}) {
  globalConfig = { ...globalConfig, ...config };
  console.log("[boto3-js] Global config updated:", globalConfig);
}

/**
 * ✅ boto3(): Main service initializer
 * Dynamically returns the right AWS service client
 */
export function boto3(service, options = {}) {
  const mergedOptions = { ...globalConfig, ...options };

  switch (service.toLowerCase()) {
    case "s3":
      return new SimpleS3(mergedOptions);

    default:
      throw new Error(`Service ${service} not supported yet.`);
  }
}
