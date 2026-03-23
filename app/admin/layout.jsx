import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import AdminSidebar from "@/components/AdminSidebar";
import t from "@/lib/theme";

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
    <div className={t.page}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 min-w-0 py-8 md:py-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
