import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-20">
      <span className="ortsschild ortsschild-muted" aria-hidden>
        <span className="ortsschild-name">Ende</span>
      </span>
      <h1 className="mt-6 font-cond text-4xl font-semibold">Diese Seite gibt es nicht</h1>
      <p className="mt-3 text-schiefer-2">Vielleicht wurde das Angebot entfernt oder der Link ist unvollständig.</p>
      <Link href="/" className="mt-6 inline-block font-medium text-rhein hover:underline">
        Zu allen Angeboten
      </Link>
    </main>
  );
}
