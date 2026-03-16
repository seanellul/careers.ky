export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { getNotifications, getUnreadCount } from "@/lib/data";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notifications — careers.ky",
  description: "View your notifications on careers.ky",
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session?.candidateId && !session?.employerAccountId) redirect("/");

  const recipientType = session.candidateId ? "candidate" : "employer";
  const recipientId = session.candidateId || session.employerAccountId;

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(recipientType, recipientId),
    getUnreadCount(recipientType, recipientId),
  ]);

  return (
    <NotificationsClient
      notifications={notifications}
      unreadCount={unreadCount}
      recipientType={recipientType}
    />
  );
}
