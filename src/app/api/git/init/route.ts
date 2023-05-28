import { cookies } from "next/headers";

import Git from "lib/git";
import ResponseDTO from "lib/response";
import { getAuthData } from "lib/token";

export async function POST(req: Request) {
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

  const { type } = await req.json();
  if (!type || typeof type !== "string") {
    return ResponseDTO.status(400).json({
      result: false,
      error: {
        title: "Bad Request",
        message: "Missing type",
      },
    });
  }

  const git = await Git.getInstance(authData);
  if (await git.isInitialized()) {
    return ResponseDTO.status(409).json({
      result: false,
      error: {
        title: "Conflict",
        message: "Repository already initialized",
      },
    });
  }

  if (type === "create_repo") {
    await git.createRepo("editorless", "config");
  }

  if (type === "create_folder_userrepo") {
    await git.createUserRepoFolder();
  }

  return ResponseDTO.status(200).json({
    result: true,
  });
}
