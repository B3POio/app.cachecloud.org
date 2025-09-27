import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/lib/getApiUrl";

// Ensure this never caches
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    // Build backend URL safely (strip trailing slash)
    const base = (getApiUrl() || "").toString().replace(/\/$/, "");
    const backendUrl = `${base}/api/auth/signup`;

    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ email, password, displayName }),
    });

    // Pass through whatever your backend returns (status + body)
    const data = await resp
      .json()
      .catch(() => ({ error: "Invalid JSON from backend" }));

    return NextResponse.json(data, { status: resp.status });
    } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign up";
    return NextResponse.json({ error: message }, { status: 500 });
  }

}
