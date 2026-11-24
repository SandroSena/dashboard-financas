// Guardas de estrutura, CI e deploy (critérios [CI] da auditoria de nov/2026).
// Leem o código-fonte e os arquivos de configuração como texto: não sobem servidor nem banco.
import ciWorkflow from '../../.github/workflows/ci.yml?raw'
import indexHtml from '../../index.html?raw'
import packageJsonRaw from '../../package.json?raw'
import vercelJsonRaw from '../../vercel.json?raw'
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>(['/src/**/*.ts', '/src/**/*.tsx', '!/src/**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
})
const tsxSources = Object.entries(sources).filter(([path]) => path.endsWith('.tsx'))

type VercelConfig = {
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const vercel = JSON.parse(vercelJsonRaw) as VercelConfig
const packageJson = JSON.parse(packageJsonRaw) as { scripts: Record<string, string> }

/** Trecho do workflow entre `  <job>:` e o próximo job de mesmo nível. */
function jobBlock(name: string): string {
  const lines = ciWorkflow.split(/\r?\n/)
  const start = lines.findIndex((line) => line === `  ${name}:`)
  if (start < 0) return ''
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^ {2}[A-Za-z0-9_-]+:\s*$/.test(line))
  return [lines[start], ...(end < 0 ? rest : rest.slice(0, end))].join('\n')
}

describe('estrutura do código', () => {
  it('AC-25 / AC-26: a varredura encontra os arquivos de src (a guarda não passa vazia)', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(50)
    expect(tsxSources.length).toBeGreaterThan(30)
  })

  it("AC-25: só src/features/painel/charts/ importa de 'recharts'", () => {
    const importers = Object.entries(sources)
      .filter(([, code]) => /from\s+['"]recharts['"]/.test(code) || /import\(\s*['"]recharts['"]\s*\)/.test(code))
      .map(([path]) => path)
    expect(importers.length).toBeGreaterThan(0)
    expect(importers.filter((path) => !path.startsWith('/src/features/painel/charts/'))).toEqual([])
  })

  it('AC-26: nenhum .tsx tem hex cru, shadow-[ ou duration-[', () => {
    const offenders: string[] = []
    for (const [path, code] of tsxSources) {
      code.split(/\r?\n/).forEach((line, index) => {
        if (/#[0-9a-fA-F]{3,8}\b/.test(line) || line.includes('shadow-[') || line.includes('duration-[')) {
          offenders.push(`${path}:${index + 1}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })
})

describe('deploy na Vercel', () => {
  // A Vercel serve o arquivo estático antes das rewrites; esta regra decide o que cai no index.html.
  const rewrite = vercel.rewrites.find((item) => item.destination === '/index.html')
  const pattern = new RegExp(`^${rewrite?.source ?? '$^'}$`)

  it('AC-07: /assets/inexistente.js não é reescrito para o index.html (a Vercel responde 404)', () => {
    expect(rewrite).toBeDefined()
    expect(pattern.test('/assets/inexistente.js')).toBe(false)
    expect(pattern.test('/assets/dashboard-page-ABC123.js')).toBe(false)
  })

  it('AC-07: rotas do app continuam caindo no index.html', () => {
    for (const path of ['/', '/entrar', '/painel', '/lancamentos', '/orcamentos', '/categorias', '/rota-que-nao-existe']) {
      expect(pattern.test(path), path).toBe(true)
    }
  })

  it("H-01: a CSP vale para todas as rotas, sem 'unsafe-inline' nem 'unsafe-eval' em script-src", () => {
    const all = vercel.headers.find((item) => item.source === '/(.*)')
    const csp = all?.headers.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''
    const directives = Object.fromEntries(
      csp
        .split(';')
        .map((part) => part.trim().split(/\s+/))
        .filter((tokens) => tokens[0])
        .map(([name, ...values]) => [name, values]),
    )
    expect(directives['script-src']).toEqual(["'self'"])
    expect(directives['frame-ancestors']).toEqual(["'none'"])
    expect(directives['object-src']).toEqual(["'none'"])
    const keys = all?.headers.map((header) => header.key) ?? []
    expect(keys).toEqual(
      expect.arrayContaining(['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']),
    )
  })

  it('H-01: o index.html não tem script inline (todos os <script> têm src)', () => {
    const scripts = indexHtml.match(/<script\b[^>]*>/g) ?? []
    expect(scripts.length).toBeGreaterThan(0)
    expect(scripts.filter((tag) => !/\bsrc=/.test(tag))).toEqual([])
  })
})

describe('workflow de CI', () => {
  const check = jobBlock('check')
  const deploy = jobBlock('deploy')

  it('AC-28: o job de checagem roda a checagem de tipos uma vez só (pelo build)', () => {
    expect(check).not.toBe('')
    expect(packageJson.scripts.build.match(/tsc -b/g)).toHaveLength(1)
    expect(packageJson.scripts.test).not.toMatch(/tsc/)
    expect(packageJson.scripts.lint).not.toMatch(/tsc/)
    const runs = [...check.matchAll(/run:\s*(.+)/g)].map((match) => match[1].trim())
    expect(runs.filter((cmd) => cmd === 'npm run build')).toHaveLength(1)
    expect(runs.filter((cmd) => /tsc|typecheck|npm run check/.test(cmd))).toEqual([])
  })

  it('AC-28: a versão do Vercel CLI é fixa', () => {
    const installs = [...ciWorkflow.matchAll(/npm install --global vercel(@\S+)?/g)]
    expect(installs).toHaveLength(1)
    expect(installs[0][1]).toMatch(/^@\d+\.\d+\.\d+$/)
  })

  it('AC-28: o deploy só roda em push para main, depois da checagem', () => {
    expect(deploy).toMatch(/needs:\s*check/)
    expect(deploy).toMatch(/if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/)
  })
})

describe('chunk de entrada', () => {
  // Grafo de imports estáticos a partir de src/main.tsx. `import()` (lazy) abre chunk próprio e
  // não entra; `import type` some na compilação e também não entra.
  const resolveSource = (from: string, spec: string): string | null => {
    let base: string
    if (spec.startsWith('@/')) base = `/src/${spec.slice(2)}`
    else if (spec.startsWith('.')) {
      const parts = from.split('/').slice(0, -1)
      for (const piece of spec.split('/')) {
        if (piece === '..') parts.pop()
        else if (piece !== '.') parts.push(piece)
      }
      base = parts.join('/')
    } else return null
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
      if (candidate in sources) return candidate
    }
    return null
  }

  function staticGraph(entry: string) {
    const files = new Set<string>()
    const packages = new Set<string>()
    const queue = [entry]
    while (queue.length > 0) {
      const file = queue.pop() as string
      if (files.has(file)) continue
      files.add(file)
      const code = sources[file] ?? ''
      const statements = /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[\s\S]*?\sfrom\s*)?['"]([^'"\n]+)['"]/g
      for (const match of code.matchAll(statements)) {
        if (match[2]) continue
        const spec = match[3]
        const local = resolveSource(file, spec)
        if (local) queue.push(local)
        else if (!spec.startsWith('.') && !spec.startsWith('@/')) packages.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])
      }
    }
    return { files, packages }
  }

  it('AC-27: a partir de src/main.tsx, nenhum import estático chega ao recharts (o painel é lazy)', () => {
    const { files, packages } = staticGraph('/src/main.tsx')
    expect(files.has('/src/app/router.tsx')).toBe(true)
    expect(files.has('/src/app/app-shell.tsx')).toBe(true)
    expect(files.has('/src/features/painel/dashboard-page.tsx')).toBe(false)
    expect([...files].filter((file) => file.startsWith('/src/features/painel/charts/'))).toEqual([])
    expect(packages.has('recharts')).toBe(false)
  })

  it('AC-27: o resolvedor enxerga o recharts quando parte do painel (a guarda não passa vazia)', () => {
    const { packages } = staticGraph('/src/features/painel/dashboard-page.tsx')
    expect(packages.has('recharts')).toBe(true)
  })
})
