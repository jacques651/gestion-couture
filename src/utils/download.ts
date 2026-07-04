// src/utils/download.ts
// Téléchargement de fichiers côté navigateur (mode application web).

export function downloadFile(
  content: BlobPart,
  filename: string,
  mimeType?: string
): void {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], mimeType ? { type: mimeType } : undefined);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(data: unknown, filename: string): void {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}
