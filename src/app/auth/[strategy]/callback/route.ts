import { redirect } from "next/navigation";

import { createToken } from "lib/token";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const pathParts = url.pathname.split("/");
  // Remove "callback" from path
  pathParts.pop();

  const strategy = pathParts.pop();

  if (!strategy) {
    redirect("/login?error=unknown_strategy");
  }

  let data: Record<string, string> | null = null;
  if (strategy === "github") {
    try {
      data = await GitHub(req);
    } catch (e: unknown) {
      if (e instanceof Error) {
        redirect(`/login?error=${e.message}`);
      }
      redirect("/login?error=unknown_error");
    }
  }

  if (!data) {
    redirect("/login?error=unknown_strategy");
  }

  const token = await createToken(data);
  cookies().set("auth_token", token);

  redirect("/");
}

async function GitHub(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");

  if (!code) {
    throw new Error("missing_code");
  }

  const requestUrl = new URL("https://github.com/login/oauth/access_token");
  requestUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  requestUrl.searchParams.set(
    "client_secret",
    process.env.GITHUB_CLIENT_SECRET
  );
  requestUrl.searchParams.set("code", code);
  requestUrl.searchParams.set(
    "redirect_uri",
    `${process.env.BASE_URL}/auth/github/callback`
  );

  const response = await fetch(requestUrl.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  console.log(data);

  const token = data.access_token;

  if (!token) {
    throw new Error("missing_token");
  }

  return { token };
}
