/** Makes the browser download `data` as a readable JSON file. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Give the browser a moment to start the download before releasing the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
