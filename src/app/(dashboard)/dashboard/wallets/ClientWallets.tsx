// app/wallets/ClientWallets.tsx
"use client";
import * as React from "react";
import Image from "next/image";
import { Plus, Wallet, ChevronRight, Pencil, Trash2, Save, X } from "lucide-react";

type Chain = "btc" | "eth";
type WalletItem = { id: string; chain: Chain; address: string; createdAt: number };

async function apiGetWallets(chain?: Chain) {
  const url = `/api/crypto/wallets${chain ? `?chain=${chain}` : ""}`;
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { bitcoin?: [], ethereum?: [] }
}
async function apiSaveWallet(chain: Chain, address: string) {
  const res = await fetch(`/api/crypto/wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ chain, address }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiDeleteWallet(chain: Chain, address: string) {
  const res = await fetch(
    `/api/crypto/wallets?chain=${chain}&address=${encodeURIComponent(address)}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiUpdateWallet(chain: Chain, oldAddress: string, newAddress: string) {
  const res = await fetch(`/api/crypto/wallets`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ chain, oldAddress, newAddress }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function ClientWallets({ initialWallets }: { initialWallets: WalletItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [createChain, setCreateChain] = React.useState<Chain | null>(null);
  const [address, setAddress] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);

  const [wallets, setWallets] = React.useState<WalletItem[]>(initialWallets);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editAddress, setEditAddress] = React.useState("");
  const [editBusy, setEditBusy] = React.useState(false);

  function validateAddress(chain: Chain, value: string) {
    const v = value.trim();
    if (!v) return "Address is required";
    if (chain === "eth") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(v)) return "Enter a valid Ethereum address (0x...)";
    } else {
      if (v.length < 26) return "Enter a valid Bitcoin address";
    }
    return null;
  }

  const refreshFromApi = React.useCallback(async () => {
    const data = await apiGetWallets();
    const btc = Array.isArray((data as any).bitcoin) ? (data as any).bitcoin : [];
    const eth = Array.isArray((data as any).ethereum) ? (data as any).ethereum : [];

    const normalized: WalletItem[] = [
      ...btc.map((w: any) => ({
        id: `btc-${w.createdAtMs ?? Date.now()}-${w.address}`,
        chain: "btc" as const,
        address: w.address,
        createdAt: Number(w.createdAtMs ?? Date.now()),
      })),
      ...eth.map((w: any) => ({
        id: `eth-${w.createdAtMs ?? Date.now()}-${w.address}`,
        chain: "eth" as const,
        address: w.address,
        createdAt: Number(w.createdAtMs ?? Date.now()),
      })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    setWallets(normalized);
  }, []);

  React.useEffect(() => {
    // Optional: keep the UI in sync after mutations or on mount
    refreshFromApi().catch((e) => console.error("load wallets failed", e));
  }, [refreshFromApi]);

  function handleSelect(chain: Chain) {
    setCreateChain(chain);
    setOpen(false);
    setAddress("");
    setSavedMsg(null);
  }

  async function handleSave() {
    if (!createChain) return;
    const err = validateAddress(createChain, address);
    if (err) {
      setSavedMsg(err);
      return;
    }
    setSaving(true);
    try {
      await apiSaveWallet(createChain, address.trim());
      await refreshFromApi();
      setSavedMsg("Wallet saved ✅");
      setCreateChain(null);
      setAddress("");
    } catch (e: any) {
      setSavedMsg(e?.message || "Failed to save wallet");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(id: string) {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    setEditingId(id);
    setEditAddress(w.address);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditAddress("");
  }
  async function saveEdit(id: string) {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    const err = validateAddress(w.chain, editAddress);
    if (err) {
      alert(err);
      return;
    }
    setEditBusy(true);
    try {
      await apiUpdateWallet(w.chain, w.address, editAddress.trim());
      await refreshFromApi();
      cancelEdit();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to update wallet");
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteWallet(id: string) {
    const w = wallets.find((x) => x.id === id);
    if (!w) return;
    if (!confirm("Delete this wallet?")) return;
    try {
      await apiDeleteWallet(w.chain, w.address);
      await refreshFromApi();
    } catch (e) {
      console.error(e);
      alert("Failed to delete wallet");
    }
  }

  function ChainBadge({ chain }: { chain: Chain }) {
    return (
      <div className="flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
        <div className="relative h-4 w-4">
          {chain === "btc" ? (
            <Image src="/bitcoin.svg" alt="BTC" fill className="object-contain" />
          ) : (
            <Image src="/ethereum.png" alt="ETH" fill className="object-contain" />
          )}
        </div>
        <span className="uppercase font-medium">{chain}</span>
      </div>
    );
  }
  function truncate(addr: string, n = 6) {
    if (addr.length <= n * 2 + 3) return addr;
    return `${addr.slice(0, n)}…${addr.slice(-n)}`;
  }

  return (
    <div className="h-full w-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">Wallets</h1>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-[var(--surface-dark)] transition"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add wallet</span>
        </button>

      </div>

      {/* Inline add form when a chain is selected */}
      {createChain && (
        <div className="mb-4 rounded-2xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-6 w-6">
                {createChain === "btc" ? (
                  <Image src="/bitcoin.svg" alt="Bitcoin" fill className="object-contain" />
                ) : (
                  <Image src="/ethereum.png" alt="Ethereum" fill className="object-contain" />
                )}
              </div>
              <div className="font-medium">
                {createChain === "btc" ? "Add Bitcoin wallet" : "Add Ethereum wallet"}
              </div>
            </div>
            <button
              onClick={() => {
                setCreateChain(null);
                setAddress("");
                setSavedMsg(null);
              }}
              className="text-sm text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </div>

          <label className="mb-1 block text-sm text-muted-foreground">
            {createChain === "btc" ? "Bitcoin address" : "Ethereum address"}
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={createChain === "btc" ? "bc1... or 1.../3..." : "0x..."}
            className="mb-3 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-transparent focus:ring-2 focus:ring-primary"
          />

          {savedMsg && <div className="mb-3 text-sm text-muted-foreground">{savedMsg}</div>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save wallet</span>
            </button>
            <button
              onClick={() => {
                setCreateChain(null);
                setAddress("");
                setSavedMsg(null);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Wallets list or empty state */}
      {wallets.length === 0 ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mb-1 text-lg font-semibold">No wallets yet</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Start by adding a wallet to track balances and performance.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {wallets.map((w) => (
            <div key={w.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left: chain + address/input */}
                <div className="flex min-w-0 items-center gap-3">
                  <ChainBadge chain={w.chain} />
                  {editingId === w.id ? (
                    <input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-[55vw] sm:w-96 rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:border-transparent focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <div className="truncate max-w-[55vw] sm:max-w-none text-sm font-mono text-muted-foreground">
                      {truncate(w.address)}
                    </div>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {editingId === w.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(w.id)}
                        disabled={editBusy}
                        aria-label="Save"
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        aria-label="Cancel"
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
                      >
                        <X className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(w.id)}
                        aria-label="Edit"
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
                      >
                        <Pencil className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => deleteWallet(w.id)}
                        aria-label="Delete"
                        className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple modal for choosing wallet type */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-1">Add a wallet</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose the type of wallet you want to add.</p>
            <div className="grid gap-3">
              <button
                onClick={() => handleSelect("btc")}
                className="group flex items-center justify-between rounded-xl border p-3 transition hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-6 w-6">
                    <Image src="/bitcoin.svg" alt="Bitcoin" fill className="object-contain" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Bitcoin</div>
                    <div className="text-xs text-muted-foreground">BTC</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => handleSelect("eth")}
                className="group flex items-center justify-between rounded-xl border p-3 transition hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-6 w-6">
                    <Image src="/ethereum.png" alt="Ethereum" fill className="object-contain" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Ethereum</div>
                    <div className="text-xs text-muted-foreground">ETH</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-lg bg-muted py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
