import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const ip = getIp(req);
  const rl = await checkLoginRateLimit(ip, email);

  if (!rl.success) {
    return NextResponse.json(
      {
        error:
          rl.reason === "ip"
            ? "Demasiados intentos desde esta IP. Espera 15 minutos."
            : "Demasiados intentos para este email. Espera una hora.",
        reset: rl.reset,
      },
      { status: 429 }
    );
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/play`;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
  });

  if (error) {
    // Never log the email at info level — only on internal errors
    console.error("[send-magic-link] Supabase OTP error:", error.status, error.message);
    return NextResponse.json({ error: "Error interno. Inténtalo de nuevo." }, { status: 500 });
  }

  // Anti-enumeration: same response whether email exists or not
  return NextResponse.json({ ok: true });
}
