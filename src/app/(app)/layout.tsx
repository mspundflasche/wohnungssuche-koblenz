import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser, getMembers, isDemo } from "@/lib/data";

// Alle Seiten hängen vom eingeloggten Nutzer ab.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // RLS zeigt die Mitgliederliste nur Mitgliedern – leer heißt: noch nicht freigeschaltet.
  const members = await getMembers();
  const isMember = members.length > 0;

  return (
    <>
      <Header email={user.email} demo={isDemo()} />
      {isMember ? (
        children
      ) : (
        <main className="mx-auto w-full max-w-xl flex-1 px-5 py-20">
          <h1 className="font-cond text-4xl font-semibold">Noch nicht freigeschaltet</h1>
          <p className="mt-4 text-schiefer-2">
            Dein Konto <strong className="text-schiefer">{user.email}</strong> ist angelegt, hat aber noch keinen Zugriff auf
            die Angebote. Bitte ein Familienmitglied, deine E-Mail-Adresse unter „Suchprofil → Wer hat Zugriff“ hinzuzufügen,
            und lade die Seite danach neu.
          </p>
        </main>
      )}
    </>
  );
}
