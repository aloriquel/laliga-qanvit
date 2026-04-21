"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const TEMPLATES = [
  { value: "evaluation_ready",         label: "1. Evaluation ready" },
  { value: "ecosystem_welcome",        label: "2. Ecosystem welcome (aprobado)" },
  { value: "ecosystem_rejected",       label: "3. Ecosystem rejected" },
  { value: "ecosystem_info_requested", label: "4. Ecosystem info requested" },
  { value: "contact_request_to_startup", label: "5. Contact request → startup" },
  { value: "contact_request_accepted", label: "6. Contact request accepted → org" },
  { value: "challenge_winner",         label: "7. Challenge winner" },
  { value: "data_export_ready",        label: "8. Data export ready" },
  { value: "alert_notification",       label: "9. Alert notification" },
  { value: "ecosystem_new_startup_alert", label: "10. Ecosystem new startup alert" },
  { value: "ecosystem_digest",         label: "11. Ecosystem digest" },
] as const;

type LogEntry = {
  template: string;
  recipient: string;
  email_id?: string;
  error?: string;
  sent_at: string;
};

export default function TestEmailSection({ adminEmail }: { adminEmail: string }) {
  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [recipient, setRecipient] = useState(adminEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: true; email_id: string; sent_at: string } | { ok: false; error: string } | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);

  async function send() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_email: recipient, template_type: template }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, email_id: data.email_id, sent_at: data.sent_at });
        setHistory(prev => [{
          template,
          recipient,
          email_id: data.email_id,
          sent_at: data.sent_at,
        }, ...prev].slice(0, 10));
      } else {
        setResult({ ok: false, error: data.error ?? "Error desconocido" });
        setHistory(prev => [{
          template,
          recipient,
          error: data.error,
          sent_at: new Date().toISOString(),
        }, ...prev].slice(0, 10));
      }
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const templateLabel = TEMPLATES.find(t => t.value === template)?.label ?? template;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-body text-sm font-semibold text-brand-navy block mb-1.5">
            Template
          </label>
          <select
            value={template}
            onChange={e => setTemplate(e.target.value as typeof template)}
            className="w-full border border-border-soft rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon bg-white"
          >
            {TEMPLATES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-sm font-semibold text-brand-navy block mb-1.5">
            Email destinatario
          </label>
          <input
            type="email"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="w-full border border-border-soft rounded-xl px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-brand-salmon"
          />
        </div>
      </div>

      <button
        onClick={send}
        disabled={loading || !recipient}
        className="flex items-center gap-2 bg-brand-navy text-white font-semibold font-body text-sm px-5 py-2.5 rounded-xl hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
      >
        <Send size={14} />
        {loading ? "Enviando…" : "Enviar test"}
      </button>

      {result && (
        <div className={`rounded-xl px-4 py-3 font-body text-sm ${result.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.ok ? (
            <span>
              ✓ Enviado correctamente · ID:{" "}
              <a
                href={`https://resend.com/emails/${result.email_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline"
              >
                {result.email_id}
              </a>
            </span>
          ) : (
            <span>✗ Error: {result.error}</span>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="font-body text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
            Últimos tests enviados
          </p>
          <div className="border border-border-soft rounded-xl overflow-hidden">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="bg-brand-lavender/30 border-b border-border-soft">
                  <th className="text-left px-3 py-2 font-semibold text-brand-navy">Template</th>
                  <th className="text-left px-3 py-2 font-semibold text-brand-navy">Destinatario</th>
                  <th className="text-left px-3 py-2 font-semibold text-brand-navy">Estado</th>
                  <th className="text-left px-3 py-2 font-semibold text-brand-navy">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {history.map((h, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-ink-secondary">{TEMPLATES.find(t => t.value === h.template)?.label ?? h.template}</td>
                    <td className="px-3 py-2 text-ink-secondary font-mono">{h.recipient}</td>
                    <td className="px-3 py-2">
                      {h.email_id ? (
                        <a href={`https://resend.com/emails/${h.email_id}`} target="_blank" rel="noopener noreferrer"
                           className="text-green-700 underline font-mono">{h.email_id.slice(0, 8)}…</a>
                      ) : (
                        <span className="text-red-600">{h.error?.slice(0, 40)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-secondary">{new Date(h.sent_at).toLocaleTimeString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
