"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "anmelden" | "registrieren" | "link";

const BUTTON: Record<Mode, string> = {
  anmelden: "Anmelden",
  registrieren: "Konto anlegen",
  link: "Anmelde-Link senden",
};

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("anmelden");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const callbackUrl = () => {
    const url = new URL("/auth/callback", window.location.origin);
    if (next && next !== "/") url.searchParams.set("next", next);
    return url.toString();
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    try {
      if (mode === "anmelden") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(
            error.message.toLowerCase().includes("email not confirmed")
              ? "Die E-Mail-Adresse ist noch nicht bestätigt. Öffne den Link aus der Bestätigungs-Mail."
              : "E-Mail oder Passwort stimmen nicht.",
          );
          return;
        }
        router.replace(next || "/");
        router.refresh();
      } else if (mode === "registrieren") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl() },
        });
        if (error) {
          setError(error.message.includes("Password") ? "Das Passwort muss mindestens 6 Zeichen haben." : error.message);
          return;
        }
        setInfo("Fast geschafft: Bestätige deine E-Mail-Adresse über den Link, den wir dir gerade geschickt haben.");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: callbackUrl(), shouldCreateUser: false },
        });
        if (error) {
          setError("Für diese E-Mail-Adresse gibt es noch kein Konto.");
          return;
        }
        setInfo("Wir haben dir einen Anmelde-Link geschickt. Er ist eine Stunde gültig.");
      }
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 block w-full rounded-md border border-linie bg-papier px-3 py-2.5 text-base text-schiefer placeholder:text-schiefer-3 focus:border-rhein focus:outline-none focus:ring-2 focus:ring-rhein/25";

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
      <div role="tablist" aria-label="Anmeldeart" className="flex gap-5 border-b border-linie">
        {(["anmelden", "registrieren", "link"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setInfo(null);
            }}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium ${
              mode === m ? "border-rhein text-schiefer" : "border-transparent text-schiefer-2 hover:text-schiefer"
            }`}
          >
            {m === "anmelden" ? "Mit Passwort" : m === "registrieren" ? "Neues Konto" : "Link per E-Mail"}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium">
        E-Mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>

      {mode !== "link" && (
        <label className="block text-sm font-medium">
          Passwort
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "registrieren" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </label>
      )}

      {mode === "registrieren" && (
        <p className="text-sm text-schiefer-2">
          Nach dem Registrieren muss dich ein Familienmitglied unter „Suchprofil“ freischalten, bevor du Angebote siehst.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="text-sm text-gut">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email || (mode !== "link" && password.length < 6)}
        className="w-full rounded-md bg-rhein px-4 py-2.5 font-medium text-white hover:bg-rhein-dunkel disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Einen Moment …" : BUTTON[mode]}
      </button>
    </form>
  );
}
