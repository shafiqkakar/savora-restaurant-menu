
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const authenticated = await isAdmin();

  if (!authenticated) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get("savora_admin_session");

  return <AdminDashboard key={session?.value ?? "admin"} />;
}
