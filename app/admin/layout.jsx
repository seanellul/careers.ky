import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminLayout({ children }) {
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_EMAIL?.trim()) {
    redirect("/");
  }

  const session = await getSession();
  if (!isAdmin(session)) {
    redirect("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
