"use client";

import { useState } from "react";
import { addMember, removeMember } from "@/lib/mutations";
import type { CurrentUser, Member } from "@/lib/types";

export function MembersEditor({ members: initial, user, demo }: { members: Member[]; user: CurrentUser; demo: boolean }) {
  const [members, setMembers] = useState(initial);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setMsg({ ok: false, text: "Bitte eine gültige E-Mail-Adresse eingeben." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const m = await addMember(demo, email, name);
      setMembers((cur) => [...cur, m]);
      setEmail("");
      setName("");
      setMsg({ ok: true, text: `${m.email} hat jetzt Zugriff, sobald das Konto angelegt und bestätigt ist.` });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(m: Member) {
    if (m.email === user.email.toLowerCase()) return;
    setBusy(true);
    setMsg(null);
    try {
      await removeMember(demo, m.email);
      setMembers((cur) => cur.filter((x) => x.email !== m.email));
      setMsg({ ok: true, text: `${m.email} hat keinen Zugriff mehr.` });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 block w-full rounded-md border border-linie bg-papier px-3 py-2 focus:border-rhein focus:outline-none";

  return (
    <div>
      <ul className="divide-y divide-linie-2 rounded-lg border border-linie bg-papier">
        {members.map((m) => (
          <li key={m.email} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span>
              <span className="font-medium">{m.display_name ?? m.email.split("@")[0]}</span>{" "}
              <span className="text-sm text-schiefer-2">{m.email}</span>
            </span>
            {m.email === user.email.toLowerCase() ? (
              <span className="text-sm text-schiefer-2">Du</span>
            ) : (
              <button type="button" disabled={busy} onClick={() => onRemove(m)} className="text-sm font-medium text-warn hover:underline">
                Zugriff entfernen
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={onAdd} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-sm font-medium">
          E-Mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">
          Name <span className="font-normal text-schiefer-2">(optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </label>
        <button type="submit" disabled={busy || !email} className="rounded-md bg-rhein px-4 py-2 font-medium text-white hover:bg-rhein-dunkel disabled:opacity-50">
          Freischalten
        </button>
      </form>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm ${msg.ok ? "text-gut" : "text-warn"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
