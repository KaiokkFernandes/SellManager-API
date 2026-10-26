// Aplica o tema salvo (ou o do sistema) antes do React montar, evitando o flash.
// Arquivo externo (e não inline) para valer com a CSP `script-src 'self'`.
try {
  var stored = localStorage.getItem('sellmanager:theme');
  var dark =
    stored === 'dark' ||
    ((stored === null || stored === 'system') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch {
  /* sem acesso ao storage: segue o CSS padrão (claro) */
}
