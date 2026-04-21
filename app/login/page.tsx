import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Entra en La Liga Qanvit con un enlace mágico o con Google.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/hub");
  }

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {/* Isotipo */}
        <div className="flex justify-center mb-8">
          <span className="font-sora font-bold text-brand-salmon text-5xl tracking-tight select-none">
            {"{ }"}
          </span>
        </div>

        <LoginForm authError={searchParams.error} />
      </div>
    </div>
  );
}
