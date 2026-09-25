"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/form";
import { type BackupError, type BackupRecords, createBackup, parseBackup } from "@/domain/backup";
import type { Account, Transaction } from "@/domain/finance/types";
import type { Profile } from "@/domain/profile";
import { toLocalDate } from "@/lib/dates";
import { downloadJson } from "@/lib/download";

const BACKUP_ERROR_MESSAGES: Record<BackupError, string> = {
  invalid_json: "Ese archivo no es una copia de LIFEOS: no se pudo leer.",
  not_a_lifeos_backup: "Ese archivo no es una copia de LIFEOS.",
  unsupported_version: "Esa copia es de una versión más nueva de LIFEOS. Actualiza la app e inténtalo de nuevo.",
  invalid_records: "La copia está dañada o fue modificada. No se importó nada.",
};

type Status = { tone: "success" | "error"; message: string };

interface BackupPanelProps {
  accounts: Account[];
  transactions: Transaction[];
  profile: Profile | undefined;
  onImport: (records: BackupRecords) => Promise<void>;
}

export function BackupPanel({ accounts, transactions, profile, onImport }: BackupPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [importing, setImporting] = useState(false);
  const hasData = accounts.length > 0 || transactions.length > 0;

  function handleExport() {
    downloadJson(`lifeos-copia-${toLocalDate()}.json`, createBackup({ accounts, transactions, profile }));
    setStatus({
      tone: "success",
      message: "Copia descargada. Guárdala en un lugar privado: contiene tu información financiera.",
    });
  }

  async function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input so choosing the same file again still triggers a change.
    event.target.value = "";
    if (!file) {
      return;
    }

    const result = parseBackup(await file.text());
    if (!result.ok) {
      setStatus({ tone: "error", message: BACKUP_ERROR_MESSAGES[result.error] });
      return;
    }

    setImporting(true);
    try {
      await onImport(result.backup);
      setStatus({
        tone: "success",
        message: `Listo: se importaron ${count(result.backup.accounts.length, "cuenta", "cuentas")} y ${count(
          result.backup.transactions.length,
          "movimiento",
          "movimientos",
        )}.`,
      });
    } catch {
      setStatus({ tone: "error", message: "No se pudo importar la copia. Tus datos no cambiaron." });
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 className="font-semibold">Copia de seguridad</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {hasData
            ? "Tus datos viven solo en este navegador. Descarga una copia cada semana para no perderlos."
            : "¿Ya usabas LIFEOS en otro navegador? Importa tu copia para recuperar tus datos."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasData && <Button onClick={handleExport}>Descargar copia</Button>}
        <Button variant="secondary" disabled={importing} onClick={() => fileInput.current?.click()}>
          {importing ? "Importando…" : "Importar copia"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChosen}
          className="hidden"
          aria-label="Archivo de copia de seguridad"
        />
      </div>

      {status && (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm ${
            status.tone === "error"
              ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
              : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          }`}
        >
          {status.message}
        </p>
      )}
    </section>
  );
}

function count(amount: number, singular: string, plural: string): string {
  return `${amount} ${amount === 1 ? singular : plural}`;
}
