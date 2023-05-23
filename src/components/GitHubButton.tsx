import GitHub from "assets/icon_github.svg";

export default function GitHubButton() {
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.append("client_id", process.env.GITHUB_CLIENT_ID);
  authUrl.searchParams.append(
    "redirect_uri",
    `${process.env.BASE_URL}/api/auth/github/callback`
  );
  authUrl.searchParams.append("scope", "read:user repo");
  authUrl.searchParams.append("allow_signup", "true");

  return (
    <a
      href={authUrl.toString()}
      className="flex items-center justify-center w-full px-4 py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-700"
    >
      <GitHub className="w-6 h-6 mr-2 fill-white" />
      <span>Sign in with GitHub</span>
    </a>
  );
}
