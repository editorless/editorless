export async function GitHubCallback(req: Request) {
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
    `${process.env.BASE_URL}/api/auth/github/callback`
  );

  const response = await fetch(requestUrl.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  const token = data.access_token;

  if (!token) {
    throw new Error("missing_token");
  }

  return { token };
}
