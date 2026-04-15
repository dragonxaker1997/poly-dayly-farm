import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";

export default async function HomePage() {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/login");
  }

  redirect(profile?.role === "owner" ? "/owner" : "/worker");
}
