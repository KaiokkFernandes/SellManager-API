/** Entrega ao navegador um arquivo baixado (sem expor o token em URL). */
export function saveFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // dá tempo do navegador iniciar o download antes de liberar a memória
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
