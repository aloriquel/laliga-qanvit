"use client";

import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/types";
import { renderAlertText, alertIcon } from "@/lib/dashboard/alert-text";
import { createBrowserClient } from "@supabase/ssr";

type AlertRow = Database["public"]["Tables"]["startup_alerts"]["Row"];
type AlertType = Database["public"]["Enums"]["alert_type"];

type Props = {
  startupId: string;
  initialAlerts: AlertRow[];
  emailEnabled: boolean;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (days > 0) return `hace ${days} día${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `hace ${hours} hora${hours !== 1 ? "s" : ""}`;
  return "hace un momento";
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AlertsTab({ startupId, initialAlerts, emailEnabled }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [emailOn, setEmailOn] = useState(emailEnabled);
  const [, startTransition] = useTransition();

  async function markRead(alertId: string) {
    const supabase = getSupabase();
    await supabase.from("startup_alerts").update({ is_read: true }).eq("id", alertId);
    setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, is_read: true } : a));
  }

  async function markAllRead() {
    const supabase = getSupabase();
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length === 0) return;
    await supabase.from("startup_alerts").update({ is_read: true }).in("id", unreadIds);
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  async function toggleEmail(val: boolean) {
    const supabase = getSupabase();
    setEmailOn(val);
    await supabase.from("startups").update({ notification_email_enabled: val }).eq("id", startupId);
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sora font-semibold text-lg text-brand-navy">
          Alertas{unread > 0 && <span className="ml-2 bg-brand-salmon text-brand-navy text-xs rounded-full px-2 py-0.5">{unread}</span>}
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-body text-xs text-ink-secondary">Email</span>
            <button
              role="switch"
              aria-checked={emailOn}
              onClick={() => toggleEmail(!emailOn)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${emailOn ? "bg-brand-salmon" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailOn ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </label>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors underline underline-offset-2"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-card border border-border-soft p-10 text-center">
          <p className="font-mono text-ink-secondary text-sm">{"{ 0 alertas }"} — seguimos monitorizando tu posición.</p>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-border-soft divide-y divide-border-soft">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${!alert.is_read ? "bg-brand-salmon/5" : ""}`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">
                {alertIcon(alert.alert_type as AlertType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-body text-sm ${!alert.is_read ? "text-brand-navy font-semibold" : "text-ink-secondary"}`}>
                  {renderAlertText(
                    alert.alert_type as AlertType,
                    alert.payload as Parameters<typeof renderAlertText>[1]
                  )}
                </p>
                <p className="font-mono text-xs text-ink-secondary/50 mt-0.5">
                  {timeAgo(alert.created_at)}
                </p>
              </div>
              {!alert.is_read && (
                <button
                  onClick={() => markRead(alert.id)}
                  className="flex-shrink-0 text-xs font-body text-ink-secondary/60 hover:text-brand-navy transition-colors mt-1 underline underline-offset-2"
                >
                  Leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
