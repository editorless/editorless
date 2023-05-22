"use client";

import GitHub from "assets/icon_github.svg";

export default function GitHubButton() {
  return (
    <a
      href={`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.BASE_URL}/auth/github/callback&scope=read:user repo&allow_signup`}
      className="flex items-center justify-center w-full px-4 py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-700"
    >
      <GitHub className="w-6 h-6 mr-2 fill-white" />
      <span>Sign in with GitHub</span>
    </a>
  );
}
