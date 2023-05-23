import { redirect } from "next/navigation";

export function GET() {
  redirect("/login?error=unknown_strategy");
}
