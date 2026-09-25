"use client";

import { useEffect } from "react";

/** Registers public/sw.js. Only in the published app: during development it would get in the way of live reloading. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Without a service worker LIFEOS still works; it just cannot open offline.
      });
    }
  }, []);

  return null;
}
