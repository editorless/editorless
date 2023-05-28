import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthData } from "lib/token";

import GitHub from "assets/icons/icon_github.svg";

export default async function LoginPage() {
  const token = cookies().get("auth_token")?.value;
  const authData = await getAuthData(token);

  if (authData) {
    redirect("/");
  }

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.append("client_id", process.env.GITHUB_CLIENT_ID);
  authUrl.searchParams.append(
    "redirect_uri",
    `${process.env.BASE_URL}/api/auth/github/callback`
  );
  authUrl.searchParams.append("scope", "read:user repo");
  authUrl.searchParams.append("allow_signup", "true");

  return (
    <div className="w-full max-w-md p-6 rounded-xl shadow-xl">
      <h1 className="text-center font-bold text-3xl">Login to Editorless</h1>
      <a
        href={authUrl.toString()}
        className="flex items-center justify-center w-full px-4 py-2 mt-6 text-white bg-gray-800 rounded-md hover:bg-gray-700"
      >
        <GitHub className="w-6 h-6 mr-2 fill-white" />
        <span>Login with GitHub</span>
      </a>
    </div>
  );
}
