import { auth } from "@/lib/firebase";
import { signInWithCustomToken, signInWithEmailAndPassword } from "firebase/auth";
import {getApiUrl} from "@/lib/getApiUrl";

export type SignUpInput = { email: string; password: string; displayName?: string };
export type SignInInput = { email: string; password: string };

const raw = getApiUrl();
const base = (raw || "").toString().replace(/\/$/, "");

export async function signupViaBackend({ email, password, displayName }: SignUpInput) {
  const url = `${base}/api/auth/signup`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Failed to sign up");
  if (!data?.customToken) throw new Error("Backend did not return customToken");

  const cred = await signInWithCustomToken(auth, data.customToken);
  const idToken = await cred.user.getIdToken();
  return { user: cred.user, idToken, uid: data.uid };
}

export async function signinViaBackend({ email, password }: SignInInput) {
  const url = `${base}/api/auth/signin`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Failed to sign in");

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();

  return { user: cred.user, idToken, server: { idToken: data.idToken, refreshToken: data.refreshToken, uid: data.uid } };
}

export async function signOutAll() {
  await auth.signOut();
}
