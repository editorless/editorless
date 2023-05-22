import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthData } from "lib/token";

export default async function Home() {
  const token = cookies().get("auth_token")?.value;

  const authData = await getAuthData(token);
  if (!authData) {
    redirect("/login");
  }

  return <main />;
}
