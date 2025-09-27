// ── src/app/(dashboard)/dashboard/settings/page.tsx (stub) ──
"use client";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";


export default function SettingsPage() {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button onClick={() => signOut(auth)} variant="secondary">Sign out</Button>
        </div>
    );
}