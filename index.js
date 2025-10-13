import SimpleS3 from "./s3/s3.js";
import dotenv from "dotenv";

dotenv.config();

let globalConfig = {};

export function setup(config) {
  globalConfig = { ...globalConfig, ...config };
}

export function boto3(service, options = {}) {
  const mergedOptions = { ...globalConfig, ...options };

  switch (service.toLowerCase()) {
    case "s3":
      return new SimpleS3(mergedOptions);
    default:
      throw new Error(`Service ${service} not supported yet.`);
  }
}
