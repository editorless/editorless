import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PromiseFsClient } from "isomorphic-git";

import NotInitializedError from "lib/errors/NotInitializedError";
import SystemError from "./errors/SystemError";

export default class S3FS {
  private constructor() {}

  private static client?: S3Client;

  static async readFile(
    path: string,
    options?: string | { encoding?: string | null }
  ) {
    if (path === undefined) {
      throw new Error("S3FS - readFile: path is undefined");
    }

    if (!S3FS.client) {
      throw new NotInitializedError();
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: path,
    });

    const result = await S3FS.client.send(command);

    if (!result.Body) {
      throw new SystemError(
        `S3FS - File not found\nGetObjectCommand failed for bucket ${process.env.AWS_S3_BUCKET_NAME} and key ${path}`,
        "ENOENT"
      );
    }

    const encoding = typeof options === "string" ? options : options?.encoding;

    if (!encoding) {
      return Buffer.from(await result.Body?.transformToByteArray());
    }
    return await result.Body.transformToString(encoding);
  }

  static async writeFile(
    path: string,
    data: string | Buffer | Uint8Array,
    options?: string | { encoding?: string | null; mode: number }
  ) {
    // TODO: Implement options.encoding and options.mode

    if (!S3FS.client) {
      throw new NotInitializedError();
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: path,
      Body: data,
    });

    await S3FS.client.send(command);
  }

  static async unlink(path: string) {
    if (!S3FS.client) {
      throw new NotInitializedError();
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: path,
    });

    await S3FS.client.send(command);
  }

  static async readdir(
    path: string,
    options?: string | { encoding?: string; recursive?: boolean }
  ) {
    if (!S3FS.client) {
      throw new NotInitializedError();
    }

    try {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: path,
      });

      const getResult = await S3FS.client.send(getCommand);

      if (getResult.Body) {
        throw new SystemError(
          `S3FS - File is not a directory\nGetObjectCommand succeeded for bucket ${process.env.AWS_S3_BUCKET_NAME} and key ${path}`,
          "ENOTDIR"
        );
      }
    } catch {}

    // Ensure path ends with '/'
    const safePath = path.endsWith("/") ? path : `${path}/`;

    const recursive = typeof options === "object" && options.recursive;

    let command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: safePath,
      Delimiter: recursive ? undefined : "/", // If recursive is set, don't use delimiter
    });

    const result = await S3FS.client.send(command);

    // If recursive option is set and there are more items to fetch
    while (
      typeof options === "object" &&
      options.recursive &&
      result.IsTruncated
    ) {
      command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Prefix: safePath,
        ContinuationToken: result.NextContinuationToken,
      });

      const nextResult = await S3FS.client.send(command);
      result.Contents = [
        ...(result.Contents || []),
        ...(nextResult.Contents || []),
      ];
      result.IsTruncated = nextResult.IsTruncated;
      result.NextContinuationToken = nextResult.NextContinuationToken;
    }

    if (result.Contents?.length === 0) {
      throw new SystemError(
        `S3FS - Directory not found\nListObjectsV2Command failed for bucket ${process.env.AWS_S3_BUCKET_NAME} and prefix ${safePath}`,
        "ENOENT"
      );
    }

    const filteredResult =
      result.Contents?.map((content) =>
        content.Key?.slice(safePath.length)
      ).filter(Boolean) ?? [];

    return filteredResult;
  }

  static async mkdir(_path: string, _mode: number) {
    // Object Storage doesn't have directories, so we don't need to do anything here
    return;
  }

  static async rmdir(path: string) {
    if (!S3FS.client) {
      throw new NotInitializedError();
    }

    // Ensure path ends with '/'
    const safePath = path.endsWith("/") ? path : `${path}/`;

    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: safePath,
    });

    try {
      const listResult = await S3FS.client.send(listCommand);

      if (listResult.Contents?.length !== 0) {
        throw new SystemError(
          `S3FS - Directory not empty\nListObjectsV2Command failed for bucket ${process.env.AWS_S3_BUCKET_NAME} and prefix ${safePath}`,
          "ENOTEMPTY"
        );
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: safePath,
      });

      await S3FS.client.send(deleteCommand);
    } catch {
      throw new SystemError(
        `S3FS - Directory not found\nListObjectsV2Command failed for bucket ${process.env.AWS_S3_BUCKET_NAME} and prefix ${safePath}`,
        "ENOENT"
      );
    }
  }

  static async stat(path: string) {
    if (!S3FS.client) {
      throw new NotInitializedError();
    }

    const headCommand = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: path,
    });

    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: path,
    });

    let headResult: HeadObjectCommandOutput | undefined = undefined;
    try {
      headResult = await S3FS.client.send(headCommand);
    } catch {}

    let listResult: ListObjectsV2CommandOutput | undefined = undefined;
    try {
      listResult = await S3FS.client.send(listCommand);
    } catch {}

    if (headResult) {
      const mtime = headResult.LastModified?.getTime() ?? 0;

      return {
        isFile: () => true,
        isDirectory: () => false,
        isSymbolicLink: () => false,
        ctimeMs: mtime,
        mtimeMs: mtime,
        size: headResult.ContentLength,
      };
    } else if (listResult && listResult?.KeyCount !== 0) {
      const mtimeList =
        (listResult?.Contents?.map((content) => content.LastModified).filter(
          Boolean
        ) as Date[]) ?? [];
      const mtimeSortedList = mtimeList.sort(
        (a, b) => b.getTime() - a.getTime()
      );
      const mtime =
        mtimeSortedList.length > 0 ? mtimeSortedList[0].getTime() : 0;

      return {
        isFile: () => false,
        isDirectory: () => true,
        isSymbolicLink: () => false,
        ctimeMs: mtime,
        mtimeMs: mtime,
        size: 0,
      };
    }

    throw new SystemError(
      `S3FS - File not found\nGetObjectCommand failed for bucket ${process.env.AWS_S3_BUCKET_NAME} and key ${path}`,
      "ENOENT"
    );
  }

  static async lstat(path: string) {
    return S3FS.stat(path);
  }

  static create(): PromiseFsClient {
    if (!S3FS.client) {
      S3FS.client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    return {
      promises: {
        readFile: S3FS.readFile,
        writeFile: S3FS.writeFile,
        unlink: S3FS.unlink,
        readdir: S3FS.readdir,
        mkdir: S3FS.mkdir,
        rmdir: S3FS.rmdir,
        stat: S3FS.stat,
        lstat: S3FS.lstat,
        symlink: async () => {},
        readlink: async () => {},
        chmod: async () => {},
      },
    };
  }
}
