import { cookies } from "next/headers";

import Git from "lib/git";
import ResponseDTO from "lib/response";
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

  await Git.getInstance(authData.token);

  return ResponseDTO.status(200).json({
    result: true,
  });
}
