import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const linkError = params.fehler === "link";

  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <span className="ortsschild ortsschild-lg" aria-label="Koblenz – Wohnungssuche">
          <span className="ortsschild-name">Koblenz</span>
          <span className="ortsschild-sub">Wohnungssuche</span>
        </span>
        <p className="mt-6 text-schiefer-2 max-w-[38ch]">
          Wohnungen und Häuser aus Koblenz und Umgebung – jeden Morgen gesammelt, von euch bewertet.
        </p>
        {linkError && (
          <p role="alert" className="mt-6 border-l-4 border-warn bg-papier px-4 py-3 text-sm">
            Der Link aus der E-Mail ist abgelaufen oder wurde schon benutzt. Melde dich mit Passwort an oder fordere einen neuen Link an.
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
