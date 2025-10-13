import { S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { SimpleS3 } from "../s3/s3.js";

jest.mock("@aws-sdk/s3-request-presigner");

const s3Mock = mockClient(S3Client);

describe("SimpleS3", () => {
  let s3;
  const BUCKET_NAME = "test-bucket";
  const KEY = "test-file.txt";

  beforeEach(() => {
    s3Mock.reset();
    s3 = new SimpleS3();
    getSignedUrl.mockResolvedValue("https://s3.mock.url/signed-url");
  });

  describe("Constructor and Debugging", () => {
    test("should initialize without crashing", () => {
      expect(s3).toBeInstanceOf(SimpleS3);
      expect(s3.client).toBeInstanceOf(S3Client);
    });

    test("should log output when debug is enabled", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const s3Debug = new SimpleS3({}, { debug: true });
      s3Mock.resolves({});

      await s3Debug.list_buckets();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Bucket Operations", () => {
    test("list_buckets should return an array of buckets", async () => {
      const mockBuckets = [{ Name: "bucket-1" }, { Name: "bucket-2" }];
      s3Mock.resolves({ Buckets: mockBuckets });
      const buckets = await s3.list_buckets();
      expect(buckets).toEqual(mockBuckets);
    });

    test("list_buckets should throw a formatted error on failure", async () => {
      s3Mock.rejects(new Error("Access Denied"));
      await expect(s3.list_buckets()).rejects.toThrow(
        "S3 list_buckets failed: Access Denied"
      );
    });

    test("create_bucket should resolve on success", async () => {
      const mockResponse = { Location: `/${BUCKET_NAME}` };
      s3Mock.resolves(mockResponse);
      const result = await s3.create_bucket(BUCKET_NAME);
      expect(result).toEqual(mockResponse);
    });

    test("delete_bucket should resolve on success", async () => {
      s3Mock.resolves({});
      await expect(s3.delete_bucket(BUCKET_NAME)).resolves.toBeDefined();
    });
  });

  describe("Object Operations", () => {
    test("list_objects should return an array of object contents", async () => {
      const mockContents = [{ Key: "file1.txt" }, { Key: "file2.txt" }];
      s3Mock.resolves({ Contents: mockContents });
      const objects = await s3.list_objects(BUCKET_NAME);
      expect(objects).toEqual(mockContents);
    });

    test("list_objects should return an empty array if bucket is empty", async () => {
      s3Mock.resolves({});
      const objects = await s3.list_objects(BUCKET_NAME);
      expect(objects).toEqual([]);
    });

    test("upload_file should resolve on success", async () => {
      const mockResponse = { ETag: '"12345"' };
      s3Mock.resolves(mockResponse);
      const result = await s3.upload_file(BUCKET_NAME, KEY, "file content");
      expect(result).toEqual(mockResponse);
    });

    test("download_file should return file content as a string", async () => {
      const fileContent = "This is the file body.";
      const mockBody = {
        transformToString: jest.fn().mockResolvedValue(fileContent),
      };
      s3Mock.resolves({ Body: mockBody });
      const body = await s3.download_file(BUCKET_NAME, KEY);
      expect(body).toBe(fileContent);
    });

    test("download_file should throw a formatted error on failure", async () => {
      s3Mock.rejects(new Error("Not Found"));
      await expect(s3.download_file(BUCKET_NAME, KEY)).rejects.toThrow(
        `S3 download_file(${BUCKET_NAME}, ${KEY}) failed: Not Found`
      );
    });

    test("delete_object should resolve on success", async () => {
      s3Mock.resolves({});
      await expect(s3.delete_object(BUCKET_NAME, KEY)).resolves.toBeDefined();
    });

    test("copy_object should resolve on success", async () => {
      const sourceKey = "source.txt";
      const destKey = "destination.txt";
      const mockResponse = { CopyObjectResult: { ETag: '"67890"' } };
      s3Mock.resolves(mockResponse);

      const result = await s3.copy_object(
        BUCKET_NAME,
        sourceKey,
        BUCKET_NAME,
        destKey
      );
      expect(result).toEqual(mockResponse);
    });

    test("copy_object should throw a formatted error on failure", async () => {
      s3Mock.rejects(new Error("Object not found"));
      await expect(
        s3.copy_object("src", "srcKey", "dest", "destKey")
      ).rejects.toThrow(
        "S3 copy_object(src/srcKey -> dest/destKey) failed: Object not found"
      );
    });
  });

  describe("Presigned URL", () => {
    test("get_object_url should return a presigned URL", async () => {
      const url = await s3.get_object_url(BUCKET_NAME, KEY);
      expect(url).toBe("https://s3.mock.url/signed-url");
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.objectContaining({
          input: { Bucket: BUCKET_NAME, Key: KEY },
        }),
        { expiresIn: 3600 }
      );
    });

    test("get_object_url should respect the expiresIn parameter", async () => {
      const expiresIn = 900;
      await s3.get_object_url(BUCKET_NAME, KEY, expiresIn);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(Object),
        { expiresIn: expiresIn }
      );
    });

    test("get_object_url should throw a formatted error on failure", async () => {
      getSignedUrl.mockRejectedValue(new Error("Invalid credentials"));
      await expect(s3.get_object_url(BUCKET_NAME, KEY)).rejects.toThrow(
        `S3 get_object_url(${BUCKET_NAME}, ${KEY}) failed: Invalid credentials`
      );
    });
  });
});
