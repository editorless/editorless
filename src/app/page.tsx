import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import LoadGit from "components/LoadGit";
import { getAuthData } from "lib/token";
import ReactQueryProvider from "components/ReactQueryProvider";

export default async function Home() {
  const token = cookies().get("auth_token")?.value;

  const authData = await getAuthData(token);
  if (!authData) {
    redirect("/login");
  }

  return (
    <main>
      <ReactQueryProvider>
        <LoadGit />
      </ReactQueryProvider>
    </main>
  );
}
