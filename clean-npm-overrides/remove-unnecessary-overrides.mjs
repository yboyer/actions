import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const packageJsonPath = 'package.json'
const packageLockPath = 'package-lock.json'
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
const overrideNames = Object.keys(packageJson.overrides ?? {})
const removedOverrides = []

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, stdio: 'inherit' }).status === 0
}

for (const overrideName of overrideNames) {
  const directory = await mkdtemp(join(tmpdir(), 'npm-override-'))

  try {
    await copyFile(packageJsonPath, join(directory, packageJsonPath))
    await copyFile(packageLockPath, join(directory, packageLockPath))
    if (existsSync('.npmrc')) await copyFile('.npmrc', join(directory, '.npmrc'))

    const candidatePath = join(directory, packageJsonPath)
    const candidate = JSON.parse(await readFile(candidatePath, 'utf8'))
    delete candidate.overrides[overrideName]
    if (Object.keys(candidate.overrides).length === 0) delete candidate.overrides
    await writeFile(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`)

    const installs = run(
      'npm',
      ['install', '--package-lock-only', '--ignore-scripts'],
      directory,
    )
    const passesAudit =
      installs &&
      run('npm', ['audit', '--omit=dev', '--audit-level=high'], directory)

    if (passesAudit) {
      await copyFile(candidatePath, packageJsonPath)
      await copyFile(join(directory, packageLockPath), packageLockPath)
      removedOverrides.push(overrideName)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const output = process.env.GITHUB_OUTPUT
if (output) {
  await writeFile(
    output,
    `changed=${removedOverrides.length > 0}\nremoved-overrides=${removedOverrides.join(',')}\n`,
    { flag: 'a' },
  )
}

if (removedOverrides.length === 0) {
  console.log('No removable npm overrides found.')
} else {
  console.log(`Removed npm overrides: ${removedOverrides.join(', ')}`)
}
