"use client";

import { usePathname } from "next/navigation";

export default function DashboardTransition({ children }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-dashboard-in">
      {children}
    </div>
  );
}
