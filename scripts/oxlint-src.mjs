// Lints every .js/.jsx file under src/ with oxlint.
// oxlint 1.x does not walk directories or expand globs on Windows shells,
// so the file list is collected here and passed explicitly.
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.jsx?$/.test(name)) files.push(path)
  }
}
walk('src')

try {
  execFileSync('npx', ['oxlint', ...files], { stdio: 'inherit', shell: true })
} catch (error) {
  process.exit(error.status ?? 1)
}
