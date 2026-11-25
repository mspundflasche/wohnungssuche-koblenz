import { MembersEditor } from "./MembersEditor";
import { ProfileForm } from "./ProfileForm";
import { getCurrentUser, getMembers, getProfile, isDemo } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default async function SuchprofilPage() {
  const user = (await getCurrentUser())!;
  const [profile, members] = await Promise.all([getProfile(), getMembers()]);

  return (
    <main className="mx-auto w-full max-w-[860px] flex-1 px-5 pt-8 pb-20">
      <h1 className="font-cond text-5xl font-semibold leading-none">Suchprofil</h1>
      <p className="mt-3 max-w-[66ch] text-schiefer-2">
        Danach sucht die tägliche Suche jeden Morgen. Harte Kriterien filtern, Wünsche und Hinweise fließen in die Passung ein.
        {profile && <> Zuletzt geändert am {fmtDate(profile.updated_at)}.</>}
      </p>

      <div className="mt-10">
        {profile ? (
          <ProfileForm profile={profile} user={user} demo={isDemo()} />
        ) : (
          <p className="text-warn">Das Suchprofil fehlt in der Datenbank. Bitte die Datenbank-Migration erneut ausführen.</p>
        )}
      </div>

      <section aria-labelledby="zugriff" className="mt-16">
        <h2 id="zugriff" className="font-cond text-2xl font-semibold">
          Wer hat Zugriff
        </h2>
        <p className="mt-1 max-w-[66ch] text-sm text-schiefer-2">
          Nur diese E-Mail-Adressen sehen die Angebote. Neue Personen legen sich auf der Anmeldeseite ein Konto an und werden hier
          freigeschaltet.
        </p>
        <div className="mt-4">
          <MembersEditor members={members} user={user} demo={isDemo()} />
        </div>
      </section>
    </main>
  );
}
