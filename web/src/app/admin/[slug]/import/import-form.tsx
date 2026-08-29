"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { parseCsv } from "@/lib/csv";
import { importSongs, type ImportState } from "./actions";

const EMPTY: ImportState = { error: null };
const PREVIEW = 8;

export default function ImportForm({
  slug,
  libraryId,
}: {
  slug: string;
  libraryId: string;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(importSongs, EMPTY);

  // Parsed in the browser so the venue sees what will happen before it does.
  const parsed = useMemo(() => (text.trim() ? parseCsv(text) : null), [text]);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
  }

  if (state.added !== undefined && !state.error) {
    return (
      <div className="mt-8 rounded-xl border border-line p-5">
        <h2 className="text-lg font-semibold">
          Imported {state.added} {state.added === 1 ? "song" : "songs"}
        </h2>
        {state.duplicates ? (
          <p className="mt-1 text-sm text-ink-soft">
            {state.duplicates} were already on the list, so they were left alone.
          </p>
        ) : null}
        <p className="mt-3 text-sm text-ink-soft">
          Genre, year, album and cover art were not looked up. Use{" "}
          <strong>Fill in details</strong> on the venue page to do that in
          batches.
        </p>
        <Link
          href={`/admin/${slug}`}
          className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-medium
 text-white hover:bg-accent-hover"
        >
          Back to the song list
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="library_id" value={libraryId} />
      <input type="hidden" name="rows" value={JSON.stringify(parsed?.rows ?? [])} />

      <div className="flex flex-wrap items-center gap-3">
        <label
          className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-sm
 font-medium hover:bg-surface-2
 hover:bg-surface-2"
        >
          Choose a CSV file
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
        </label>
        {fileName && (
          <span className="text-sm text-ink-soft">{fileName}</span>
        )}
      </div>

      <label htmlFor="csv" className="mt-6 block text-sm font-medium">
        Or paste the rows
      </label>
      <textarea
        id="csv"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFileName(null);
        }}
        rows={8}
        spellCheck={false}
        placeholder={'Africa,Toto,Rock,4:55,1982,Toto IV\n"1, 2 Step",Ciara'}
        className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-mono
 text-sm"
      />

      {parsed && (
        <section className="mt-6" aria-live="polite">
          <h2 className="text-sm font-semibold">
            {parsed.rows.length} {parsed.rows.length === 1 ? "song" : "songs"} ready
            {parsed.hadHeader && (
              <span className="ml-2 font-normal text-ink-soft">
                header row skipped
              </span>
            )}
          </h2>

          {parsed.rows.length > 0 && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-3 py-2 font-medium">Title</th>
                    <th scope="col" className="px-3 py-2 font-medium">Artist</th>
                    <th scope="col" className="px-3 py-2 font-medium">Genre</th>
                    <th scope="col" className="px-3 py-2 font-medium">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, PREVIEW).map((row) => (
                    <tr
                      key={row.line}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-3 py-1.5">{row.title}</td>
                      <td className="px-3 py-1.5 text-ink-soft">
                        {row.artist}
                      </td>
                      <td className="px-3 py-1.5 text-ink-soft">
                        {row.genre ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums text-ink-soft">
                        {row.year ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > PREVIEW && (
                <p className="px-3 py-2 text-xs text-ink-soft">
                  and {parsed.rows.length - PREVIEW} more
                </p>
              )}
            </div>
          )}

          {parsed.skipped.length > 0 && (
            <details className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2
 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
              <summary className="cursor-pointer font-medium">
                {parsed.skipped.length}{" "}
                {parsed.skipped.length === 1 ? "line" : "lines"} will be skipped
              </summary>
              <ul className="mt-2 space-y-1 text-ink-soft">
                {parsed.skipped.slice(0, 20).map((s) => (
                  <li key={s.line}>
                    <span className="tabular-nums text-ink-soft">line {s.line}</span>{" "}
                    — {s.reason}: <code className="text-xs">{s.raw}</code>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !parsed?.rows.length}
        className="mt-6 rounded-lg bg-accent px-4 py-2.5 font-medium text-white
 hover:bg-accent-hover disabled:opacity-60"
      >
        {pending
          ? "Importing…"
          : parsed?.rows.length
            ? `Import ${parsed.rows.length} ${parsed.rows.length === 1 ? "song" : "songs"}`
            : "Import"}
      </button>
    </form>
  );
}
