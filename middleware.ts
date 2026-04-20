import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // /dashboard/** → must be authenticated startup
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/play", request.url));
    }
    // Check startup exists
    const { data: startup } = await supabase
      .from("startups")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!startup) {
      return NextResponse.redirect(new URL("/play", request.url));
    }
  }

  // /admin/** → must be admin role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // /ecosistema/dashboard/** → must be ecosystem role
  if (pathname.startsWith("/ecosistema/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/ecosistema/aplicar", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "ecosystem") {
      return NextResponse.redirect(new URL("/ecosistema/aplicar", request.url));
    }
  }

  // /play/re-subir → must be authenticated with a startup
  if (pathname === "/play/re-subir") {
    if (!user) {
      return NextResponse.redirect(new URL("/play", request.url));
    }
    const { data: startup } = await supabase
      .from("startups")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!startup) {
      return NextResponse.redirect(new URL("/play", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/ecosistema/dashboard/:path*",
    "/play/re-subir",
  ],
};
