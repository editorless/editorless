import Git from "lib/git";
import { getAuthData } from "lib/token";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const token = cookies().get("auth_token")?.value;
  const authData = await getAuthData(token);

  if (!authData) {
    redirect("/app/login");
  }

  const git = await Git.getInstance(authData);
  const initialized = await git.isInitialized();

  if (!initialized) {
    redirect("/app/setup/1");
  }

  redirect("/app/setup/2");
}
