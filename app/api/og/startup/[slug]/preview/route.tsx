// Download variant of the OG image — same PNG with attachment Content-Disposition
import { GET as baseGet } from "../route";

export const runtime = "edge";
export const revalidate = 3600;

type Props = { params: { slug: string } };

export async function GET(req: Request, { params }: Props) {
  const res = await baseGet(req, { params });

  // Materialize the full PNG buffer before cloning — ImageResponse streams
  // cannot be piped directly into a new Response in Edge Runtime.
  const body = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  headers.set("Content-Disposition", `attachment; filename="laliga-${params.slug}.png"`);

  return new Response(body, {
    status: res.status,
    headers,
  });
}
