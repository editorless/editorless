import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Git from "lib/git";
import { getAuthData } from "lib/token";
import Form from "./Form";

export default async function Setup1Page() {
  const token = cookies().get("auth_token")?.value;
  const authData = await getAuthData(token);

  if (!authData) {
    redirect("/app/login");
  }

  const git = await Git.getInstance(authData);
  const repos = await git.getRepos();

  const hasUserRepo = repos.some((repo) => repo.name === authData.username);

  return (
    <Form
      className="mt-6"
      username={authData.username}
      hasUserRepo={hasUserRepo}
    />
  );
}
