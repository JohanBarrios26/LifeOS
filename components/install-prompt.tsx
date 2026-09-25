"use client";

import { useEffect, useState } from "react";
import { useIsBrowser } from "@/lib/use-is-browser";

/** Chrome's install event. It is not in TypeScript's standard types because only some browsers have it. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Invites the person to install LIFEOS. Chrome, Edge and Samsung Internet open their own installer;
 * iPhone has no installer that a page can open, so the steps are explained instead.
 */
export function InstallPrompt() {
  const isBrowser = useIsBrowser();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onInstallable = (event: Event) => {
      event.preventDefault(); // Show our button instead of the browser's own banner.
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!isBrowser) {
    return null;
  }
  const runningAsApp =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (runningAsApp) {
    return null;
  }

  if (installed) {
    return (
      <p role="status" className={boxClassName}>
        ✅ LIFEOS quedó instalada. Búscala en tus aplicaciones.
      </p>
    );
  }

  if (installEvent) {
    return (
      <div className={`${boxClassName} flex items-center justify-between gap-3`}>
        <span>📲 Usa LIFEOS como una app, con su propio ícono.</span>
        <button
          type="button"
          onClick={async () => {
            await installEvent.prompt();
            const { outcome } = await installEvent.userChoice;
            if (outcome === "accepted") {
              setInstalled(true);
            }
            setInstallEvent(null); // The browser allows each event to be used only once.
          }}
          className="shrink-0 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Instalar LIFEOS
        </button>
      </div>
    );
  }

  const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return (
    <details className={boxClassName}>
      <summary className="cursor-pointer font-medium">📲 ¿Cómo instalar LIFEOS en tu celular?</summary>
      <div className="mt-2 flex flex-col gap-1">
        {isIPhone ? (
          <p>
            En <strong>Safari</strong>: toca el botón <strong>Compartir</strong> (cuadrado con flecha) →{" "}
            <strong>Agregar a inicio</strong> → <strong>Agregar</strong>.
          </p>
        ) : (
          <p>
            En <strong>Chrome</strong>: toca el menú <strong>⋮</strong> → <strong>Instalar app</strong> (o{" "}
            <strong>Agregar a la pantalla principal</strong>).
          </p>
        )}
        <p className="opacity-80">
          No uses el botón de descarga ⬇ del navegador: ese guarda la página como archivo, no instala la app.
        </p>
      </div>
    </details>
  );
}

const boxClassName =
  "rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900";
