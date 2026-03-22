"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, ChevronLeft, ExternalLink } from "lucide-react";
import t from "@/lib/theme";

export default function NotificationsClient({ notifications, unreadCount, recipientType }) {
  const router = useRouter();
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkOne = async (id) => {
    await fetch("/api/notifications/mark-read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href={recipientType === "candidate" ? "/profile" : "/talent"}>
            <Button variant="secondary" className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8" /> Notifications
            </h1>
            {unreadCount > 0 && <p className="text-neutral-500">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAll} disabled={markingAll} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Mark All Read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={`border transition ${n.is_read ? "bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" : "bg-primary-50 dark:bg-primary-500/15 border-primary-200 dark:border-primary-500/30"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{n.title}</h3>
                      {!n.is_read && <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 text-xs">New</Badge>}
                    </div>
                    {n.body && <p className="text-sm text-neutral-500 mb-2">{n.body}</p>}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500">{formatDate(n.created_at)}</span>
                      {n.link && (
                        <Link href={n.link} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => handleMarkOne(n.id)} className="p-1 rounded hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 transition" title="Mark as read">
                      <CheckCircle className="w-4 h-4 text-neutral-500" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {notifications.length === 0 && (
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
                <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                <p className="text-neutral-500">You'll be notified when new jobs match your profile or employers want to connect.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
