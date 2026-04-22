"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";

type OrgType = "science_park" | "cluster" | "innovation_association" | "other";

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  science_park:           "Parque científico o tecnológico",
  cluster:                "Cluster sectorial",
  innovation_association: "Asociación de innovación",
  other:                  "Otro",
};

export default function EcoApplicationForm({ userEmail }: { userEmail: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm] = useState({
    name:     "",
    org_type: "" as OrgType | "",
    website:  "",
    about:    "",
    region:   "",
  });

  const isValid =
    form.name.trim().length >= 2 &&
    form.org_type !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ecosystem/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name.trim(),
          org_type: form.org_type,
          website:  form.website.trim() || undefined,
          about:    form.about.trim()   || undefined,
          region:   form.region.trim()  || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Hubo un problema procesando tu solicitud. Escríbenos a holaqanvit@gmail.com.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-hero shadow-card border border-border-soft p-12 max-w-md w-full text-center flex flex-col items-center gap-5">
        <CheckCircle2 className="h-12 w-12 text-brand-navy" />
        <h2 className="font-sora font-bold text-2xl text-brand-navy">
          Solicitud recibida
        </h2>
        <p className="font-body text-ink-secondary text-sm leading-relaxed">
          Revisaremos tu solicitud y te contactaremos en 24-48h en{" "}
          <strong>{userEmail}</strong> con los próximos pasos y tu código de referral.
        </p>
        <p className="font-mono text-xs text-ink-secondary">
          {"{ gracias por unirte al ecosistema }"}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-5"
    >
      {/* Logged-in as */}
      <div className="text-xs font-body text-ink-secondary bg-brand-lavender/60 rounded-lg px-3 py-2">
        Solicitando como: <strong className="text-brand-navy">{userEmail}</strong>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="org-name" className="font-body text-sm text-ink-primary">
          Nombre de la organización *
        </Label>
        <Input
          id="org-name"
          placeholder="Ej. Parque Científico de Madrid"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="font-body border-border-soft"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="org-type" className="font-body text-sm text-ink-primary">
          Tipo de organización *
        </Label>
        <Select
          value={form.org_type}
          onValueChange={(v) => setForm((f) => ({ ...f, org_type: v as OrgType }))}
        >
          <SelectTrigger id="org-type" className="font-body border-border-soft">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ORG_TYPE_LABELS) as [OrgType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value} className="font-body">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="org-region" className="font-body text-sm text-ink-primary">
          Región / comunidad autónoma
        </Label>
        <Input
          id="org-region"
          placeholder="Ej. Madrid, Cataluña, País Vasco…"
          value={form.region}
          onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
          className="font-body border-border-soft"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="org-web" className="font-body text-sm text-ink-primary">
          Web
        </Label>
        <Input
          id="org-web"
          type="url"
          placeholder="https://tuparque.es"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          className="font-body border-border-soft"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="org-about" className="font-body text-sm text-ink-primary">
          Descripción breve
        </Label>
        <textarea
          id="org-about"
          rows={3}
          placeholder="¿A qué os dedicáis? ¿En qué verticales tenéis foco?"
          value={form.about}
          onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
          className="flex min-h-[80px] w-full rounded-md border border-border-soft bg-background px-3 py-2 text-sm font-body text-ink-primary ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={!isValid || loading}
        className="bg-brand-navy text-white hover:bg-brand-navy/90 font-semibold rounded-xl mt-2 h-12"
      >
        {loading ? "Enviando solicitud…" : "Solicitar acceso"}
      </Button>
    </form>
  );
}
