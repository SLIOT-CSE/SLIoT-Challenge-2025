/** Saves text as a file through the browser's download. The CSV already carries its own byte-order mark */
export function downloadTextFile(text: string, fileName: string, type = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the address goes away
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
