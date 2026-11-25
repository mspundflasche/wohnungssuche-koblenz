# Wohnungssuche Koblenz

Live: https://wohnungssuche-koblenz.vercel.app

Webseite zur täglichen Suche nach Wohnungen und Häusern (Miete und Kauf) in Koblenz und Umgebung für eine 4-köpfige Familie mit Home-Office-Bedarf.

- **Tägliche Suche:** eine geplante Claude-Aufgabe (jeden Morgen 6:38 Uhr) durchsucht immosuchmaschine.de, ohne-makler.net und die Websuche, filtert nach dem Suchprofil, bewertet jedes Angebot (Passung 0–100) und schreibt alles über den Supabase-Connector in die Datenbank. Der Prompt liegt in [`docs/taegliche-suche.md`](docs/taegliche-suche.md).
- **Webseite (Next.js 16, Vercel):** Karte, Liste, Preisdiagramme, Bewertung pro Person mit Gründen und Notizen, Suchprofil, Lernstand.
- **Lernen:** Jede Bewertung landet in `feedback`. Die SQL-Funktion `learned_profile()` fasst sie zusammen (Orte, Gründe, Merkmale, Preise von „gefällt“ vs. „passt nicht“). Die tägliche Aufgabe liest das, bewertet unbewertete Angebote neu und schreibt ihre Zusammenfassung nach `learned_preferences` – sichtbar unter „Lernstand“.
- **Zugriff:** Supabase Auth (E-Mail + Passwort oder Login-Link). Row Level Security lässt nur E-Mail-Adressen aus `app_members` an die Daten.

## Einrichtung

1. Supabase: Migrationen aus `supabase/migrations/` ausführen (im Projekt `wohnungssuche-koblenz`, Region Frankfurt, bereits erledigt).
2. Supabase → Authentication → URL Configuration: **Site URL** `https://wohnungssuche-koblenz.vercel.app`, unter **Redirect URLs** `https://wohnungssuche-koblenz.vercel.app/**` eintragen.
3. Vercel (erledigt, Projekt `wohnungssuche-koblenz`, Funktionen in Frankfurt): jeder Push auf `main` geht automatisch live. Umgebungsvariablen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Erste E-Mail-Adresse freischalten (SQL-Editor): `insert into public.app_members (email, display_name) values ('du@example.org', 'Name');` – weitere Personen danach auf der Seite „Suchprofil“.

## Lokal ansehen

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev
```

Mit `DEMO_MODE=1` in `.env.local` läuft die Oberfläche mit erfundenen Beispieldaten ohne Login und Datenbank. Niemals auf Vercel setzen.

## Datenmodell

| Tabelle | Inhalt | Schreibt |
|---|---|---|
| `listings` | gefundene Angebote mit Passung und Begründung | tägliche Aufgabe (Status `pipeline` auch die Webseite) |
| `feedback` | Bewertung je Person: −1 passt nicht, 1 interessant, 2 Favorit, Gründe, Notiz | Webseite |
| `search_profile` | Suchkriterien (eine Zeile) | Webseite |
| `learned_preferences` | Zusammenfassung dessen, was die Suche gelernt hat | tägliche Aufgabe |
| `search_runs` | Protokoll der Suchläufe | tägliche Aufgabe |
| `app_members` | freigeschaltete E-Mail-Adressen | Webseite (nur Mitglieder) |
