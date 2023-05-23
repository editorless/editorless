import { cookies } from "next/headers";

import { clone } from "isomorphic-git";
import * as http from "isomorphic-git/http/node";

import ResponseDTO from "lib/response";
import S3FS from "lib/s3fs";
import { getAuthData } from "lib/token";

export async function POST() {
  const token = cookies().get("auth_token")?.value;

  const authData = await getAuthData(token);
  if (!authData) {
    return ResponseDTO.status(401).json({
      result: false,
      error: {
        title: "Unauthorized",
        message: "Invalid token",
      },
    });
  }

  const fs = S3FS.create();
  try {
    await fs.promises.unlink(`/${authData.id}/.git/HEAD`);
    await fs.promises.unlink(`/${authData.id}/.git/refs/heads/master`);
    await fs.promises.rmdir(`/${authData.id}/.git/refs/heads`);
  } catch {}

  await clone({
    fs,
    http,
    dir: `/${authData.id}`,
    url: "https://github.com/maxswjeon/maxswjeon",
  });

  return ResponseDTO.status(200).json({
    result: true,
  });
}
