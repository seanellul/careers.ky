"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2 } from "lucide-react";

export default function AlertsClient({ alerts: initialAlerts }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (alertId) => {
    setDeleting(alertId);
    try {
      const res = await fetch(`/api/profile`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          <span className="text-primary-500">Job Alerts</span>
        </h1>
        <p className="text-neutral-500">
          Get notified when new jobs match your criteria.
        </p>
      </div>

      {alerts.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
            <h3 className="text-lg font-medium mb-2">No alerts set up</h3>
            <p className="text-neutral-500">
              Job alerts will be available soon. Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-500/15 grid place-items-center shrink-0">
                      <Bell className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <div className="font-medium text-sm mb-1">
                        {alert.filters?.keywords || "All jobs"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {alert.frequency && (
                          <Badge className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">
                            {alert.frequency}
                          </Badge>
                        )}
                        {alert.filters?.location && (
                          <Badge className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">
                            {alert.filters.location}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-2">
                        Created {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(alert.id)}
                    disabled={deleting === alert.id}
                    className="gap-1.5 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
