import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { checkout, clone, pull } from "isomorphic-git";
import * as http from "isomorphic-git/http/node";

import S3FS from "lib/s3fs";
import { getAuthData } from "lib/token";

export default async function Home() {
  const token = cookies().get("auth_token")?.value;

  const authData = await getAuthData(token);
  if (!authData) {
    redirect("/login");
  }

  const fs = S3FS.create();

  try {
    await fs.promises.stat(`${authData.id}/.git`);

    await checkout({
      fs,
      dir: `${authData.id}`,
      ref: "main",
    });

    await pull({
      fs,
      http,
      dir: `${authData.id}`,
      ref: "main",
    });
  } catch {
    await clone({
      fs,
      http,
      dir: `${authData.id}`,
      url: "https://github.com/maxswjeon/maxswjeon",
    });
  }

  return <main />;
}
