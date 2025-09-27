import { NextRequest, NextResponse } from "next/server";
import {getApiUrl} from "@/lib/getApiUrl";

// never cache this
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const base = (getApiUrl() || "").toString().replace(/\/$/, "");
    const backendUrl = `${base}/api/auth/signin`;

    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json().catch(() => ({ error: "Invalid JSON from backend" }));
    return NextResponse.json(data, { status: resp.status });
    } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
