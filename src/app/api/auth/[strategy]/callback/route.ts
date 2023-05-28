import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createToken } from "lib/token";

import { GitHubCallback } from "./github";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const pathParts = url.pathname.split("/");
  // Remove "callback" from path
  pathParts.pop();

  const strategy = pathParts.pop();

  if (!strategy) {
    redirect("/app/login?error=unknown_strategy");
  }

  let data: Record<string, string> | null = null;
  if (strategy === "github") {
    try {
      data = await GitHubCallback(req);
    } catch (e: unknown) {
      if (e instanceof Error) {
        redirect(`/app/login?error=${e.message}`);
      }
      redirect("/app/login?error=unknown_error");
    }
  }

  if (!data) {
    redirect("/app/login?error=unknown_strategy");
  }

  const token = await createToken(data.token);
  cookies().set("auth_token", token);

  redirect("/app");
}
