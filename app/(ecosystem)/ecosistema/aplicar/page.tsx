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
import { CheckCircle2 } from "lucide-react";

type OrgType = "science_park" | "cluster" | "innovation_association" | "other";

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  science_park: "Parque científico o tecnológico",
  cluster: "Cluster sectorial",
  innovation_association: "Asociación de innovación",
  other: "Otro",
};

export default function EcosistemaAplicarPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    org_type: "" as OrgType | "",
    website: "",
    about: "",
    email: "",
  });

  const isValid =
    form.name.trim().length > 0 &&
    form.org_type !== "" &&
    form.email.includes("@");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);

    // TODO (prompt #4): POST to API route that inserts ecosystem_organizations
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-brand-lavender min-h-screen py-16 flex items-center justify-center">
        <div className="bg-white rounded-hero shadow-card border border-border-soft p-12 max-w-md w-full text-center flex flex-col items-center gap-5">
          <CheckCircle2 className="h-12 w-12 text-brand-navy" />
          <h2 className="font-sora font-bold text-2xl text-brand-navy">
            Solicitud recibida
          </h2>
          <p className="font-body text-ink-secondary text-sm leading-relaxed">
            Revisaremos tu solicitud y te contactaremos en 24-48h con los
            próximos pasos y tu código de referral.
          </p>
          <p className="font-mono text-xs text-ink-secondary">
            {"{ gracias por unirte al ecosistema }"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand max-w-lg">
        <div className="mb-8">
          <p className="font-mono text-brand-navy/40 text-sm tracking-widest uppercase mb-3">
            {"{ ecosistema }"}
          </p>
          <h1 className="font-sora font-bold text-3xl text-brand-navy">
            Únete como ecosistema
          </h1>
          <p className="font-body text-ink-secondary mt-2 text-sm">
            Parques, clusters y asociaciones de innovación. Accede al mapa de
            startups españolas contribuyendo al ecosistema.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-5"
        >
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
              onValueChange={(v) =>
                setForm((f) => ({ ...f, org_type: v as OrgType }))
              }
            >
              <SelectTrigger id="org-type" className="font-body border-border-soft">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ORG_TYPE_LABELS) as [OrgType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value} className="font-body">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="org-email" className="font-body text-sm text-ink-primary">
              Email institucional *
            </Label>
            <Input
              id="org-email"
              type="email"
              placeholder="hola@tuparque.es"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="font-body border-border-soft"
              required
            />
            <p className="font-mono text-xs text-ink-secondary">
              Usaremos este email para verificar vuestra organización.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!isValid || loading}
            className="bg-brand-navy text-white hover:bg-brand-navy/90 font-semibold rounded-xl mt-2 h-12"
          >
            {loading ? "Enviando..." : "Solicitar acceso"}
          </Button>
        </form>

        <div className="mt-8 bg-white/60 rounded-card border border-border-soft p-6">
          <h3 className="font-sora font-semibold text-sm text-brand-navy mb-3">
            ¿Qué ocurre después?
          </h3>
          <ol className="flex flex-col gap-2 font-body text-xs text-ink-secondary list-decimal list-inside space-y-1">
            <li>Revisamos tu solicitud (24-48h).</li>
            <li>Te enviamos tu código de referral único y acceso al dashboard.</li>
            <li>
              Empiezas como <strong>Rookie</strong> y subes de tier contribuyendo:
              refiriendo startups, validando feedback.
            </li>
            <li>Cuanto más contribuyes, más datos desbloqueas.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
