import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')

const path = '.env.demo'
const demo = [
  { key: 'MANAGER', email: 'demo.manager@kontur.example', name: 'Александр Морозов' },
  { key: 'MARIA', email: 'demo.maria@kontur.example', name: 'Мария Ким' },
  { key: 'ILYA', email: 'demo.ilya@kontur.example', name: 'Илья Соколов' },
]

if (!existsSync(path)) {
  const lines = demo.flatMap(user => [`DEMO_${user.key}_EMAIL=${user.email}`, `DEMO_${user.key}_PASSWORD=${randomBytes(18).toString('base64url')}`])
  writeFileSync(path, `${lines.join('\n')}\n`, { flag: 'wx', mode: 0o600 })
}

const credentials = Object.fromEntries(readFileSync(path, 'utf8').trim().split('\n').map(line => line.split('=', 2)))
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

for (const user of demo) {
  const { data, error } = await admin.auth.admin.createUser({
    email: credentials[`DEMO_${user.key}_EMAIL`],
    password: credentials[`DEMO_${user.key}_PASSWORD`],
    email_confirm: true,
    user_metadata: { full_name: user.name },
  })
  if (error) throw new Error(`Failed to create ${user.key}: ${error.message}`)
  console.log(`${user.key}: ${data.user.id}`)
}

console.log('Demo credentials saved in ignored .env.demo')
