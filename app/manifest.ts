import type { MetadataRoute } from "next";

// The web app manifest: what the phone needs to install LIFEOS like a regular app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIFEOS",
    short_name: "LIFEOS",
    description: "Registra los hechos importantes de tu vida y entiende tu progreso con datos reales.",
    lang: "es-CO",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-pressing the app icon offers these shortcuts.
    shortcuts: [
      {
        name: "Registrar movimiento",
        short_name: "Registrar",
        url: "/?registrar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Reporte del mes",
        short_name: "Reporte",
        url: "/reporte",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
