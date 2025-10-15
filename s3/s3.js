import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class SimpleS3 {
  constructor(options = {}, { debug = false } = {}) {
    // AWS SDK automatically handles:
    // 1. options.credentials
    // 2. environment variables
    // 3. default profile
    this.client = new S3Client(options);
    this.debug = debug;
  }

  _formatOutput(data) {
    if (this.debug) {
      console.log(JSON.stringify(data, null, 2));
    }
    return data;
  }

  _handleError(operation, err) {
    throw new Error(`S3 ${operation} failed: ${err.message}`);
  }

  async listBuckets() {
    try {
      const res = await this.client.send(new ListBucketsCommand({}));
      return this._formatOutput(res.Buckets || []);
    } catch (err) {
      this._handleError("listBuckets", err);
    }
  }

  async createBucket(bucketName) {
    try {
      const res = await this.client.send(
        new CreateBucketCommand({ Bucket: bucketName })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`createBucket(${bucketName})`, err);
    }
  }

  async deleteBucket(bucketName) {
    try {
      const res = await this.client.send(
        new DeleteBucketCommand({ Bucket: bucketName })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteBucket(${bucketName})`, err);
    }
  }

  async listObjects(bucketName) {
    try {
      const res = await this.client.send(
        new ListObjectsV2Command({ Bucket: bucketName })
      );
      return this._formatOutput(res.Contents || []);
    } catch (err) {
      this._handleError(`listObjects(${bucketName})`, err);
    }
  }

  async uploadFile(bucket, key, body) {
    try {
      const res = await this.client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`uploadFile(${bucket}, ${key})`, err);
    }
  }

  async downloadFile(bucket, key) {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const body = await res.Body.transformToString();
      return this._formatOutput(body);
    } catch (err) {
      this._handleError(`downloadFile(${bucket}, ${key})`, err);
    }
  }

  async deleteObject(bucket, key) {
    try {
      const res = await this.client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`deleteObject(${bucket}, ${key})`, err);
    }
  }

  async copyObject(sourceBucket, sourceKey, destBucket, destKey) {
    try {
      const res = await this.client.send(
        new CopyObjectCommand({
          Bucket: destBucket,
          CopySource: `${sourceBucket}/${sourceKey}`,
          Key: destKey,
        })
      );
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(
        `copyObject(${sourceBucket}/${sourceKey} -> ${destBucket}/${destKey})`,
        err
      );
    }
  }

  async getObjectURL(bucket, key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return this._formatOutput(url);
    } catch (err) {
      this._handleError(`getObjectURL(${bucket}, ${key})`, err);
    }
  }
}

export default SimpleS3;
