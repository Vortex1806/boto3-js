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

  async list_buckets() {
    try {
      const res = await this.client.send(new ListBucketsCommand({}));
      return this._formatOutput(res.Buckets || []);
    } catch (err) {
      this._handleError("list_buckets", err);
    }
  }

  async create_bucket(bucketName) {
    try {
      const res = await this.client.send(new CreateBucketCommand({ Bucket: bucketName }));
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`create_bucket(${bucketName})`, err);
    }
  }

  async delete_bucket(bucketName) {
    try {
      const res = await this.client.send(new DeleteBucketCommand({ Bucket: bucketName }));
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`delete_bucket(${bucketName})`, err);
    }
  }

  async list_objects(bucketName) {
    try {
      const res = await this.client.send(new ListObjectsV2Command({ Bucket: bucketName }));
      return this._formatOutput(res.Contents || []);
    } catch (err) {
      this._handleError(`list_objects(${bucketName})`, err);
    }
  }

  async upload_file(bucket, key, body) {
    try {
      const res = await this.client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }));
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`upload_file(${bucket}, ${key})`, err);
    }
  }

  async download_file(bucket, key) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const body = await res.Body.transformToString();
      return this._formatOutput(body);
    } catch (err) {
      this._handleError(`download_file(${bucket}, ${key})`, err);
    }
  }

  async delete_object(bucket, key) {
    try {
      const res = await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return this._formatOutput(res);
    } catch (err) {
      this._handleError(`delete_object(${bucket}, ${key})`, err);
    }
  }

  async copy_object(sourceBucket, sourceKey, destBucket, destKey) {
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
      this._handleError(`copy_object(${sourceBucket}/${sourceKey} -> ${destBucket}/${destKey})`, err);
    }
  }

  async get_object_url(bucket, key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return this._formatOutput(url);
    } catch (err) {
      this._handleError(`get_object_url(${bucket}, ${key})`, err);
    }
  }
}

export default SimpleS3;
