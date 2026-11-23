// Aplica o tema salvo antes do app carregar, para a tela não piscar.
// O escuro é o padrão; só "light" salvo deixa o tema claro.
// Fica fora do index.html para a CSP não precisar de 'unsafe-inline' em script-src.
try {
  if (localStorage.getItem('financas-theme') !== 'light') {
    document.documentElement.classList.add('dark')
  }
} catch {
  document.documentElement.classList.add('dark')
}
