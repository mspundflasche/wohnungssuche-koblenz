"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-20">
      <h1 className="font-cond text-4xl font-semibold">Daten konnten nicht geladen werden</h1>
      <p className="mt-4 text-schiefer-2">{error.message || "Die Verbindung zur Datenbank ist fehlgeschlagen."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-rhein px-4 py-2 font-medium text-white hover:bg-rhein-dunkel"
      >
        Erneut versuchen
      </button>
    </main>
  );
}
