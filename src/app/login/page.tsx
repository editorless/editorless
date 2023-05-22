import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthData } from "lib/token";

import GitHubButton from "components/GitHubButton";

export default async function LoginPage() {
  const token = cookies().get("auth_token")?.value;
  const authData = await getAuthData(token);

  if (authData) {
    redirect("/");
  }

  return (
    <div className="w-full max-w-md p-6 rounded-xl shadow-xl">
      <h1 className="text-center font-bold text-3xl">Blog Editor</h1>
      <GitHubButton />
    </div>
  );
}
