import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const readEnv = path => Object.fromEntries(readFileSync(path, 'utf8').trim().split('\n').map(line => line.split('=', 2)))
const env = { ...readEnv('.env.local'), ...readEnv('.env.demo') }
const client = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

async function signIn(key) {
  const db = client()
  const { error } = await db.auth.signInWithPassword({ email: env[`DEMO_${key}_EMAIL`], password: env[`DEMO_${key}_PASSWORD`] })
  assert.ifError(error)
  return db
}

const manager = await signIn('MANAGER')
const maria = await signIn('MARIA')
const ilya = await signIn('ILYA')

const managerTasks = await manager.from('tasks').select('id,title,status,assignee_id')
const mariaTasks = await maria.from('tasks').select('id,title,status,assignee_id')
const ilyaTasks = await ilya.from('tasks').select('id,title,status,assignee_id')
assert.ifError(managerTasks.error)
assert.ifError(mariaTasks.error)
assert.ifError(ilyaTasks.error)
assert.equal(managerTasks.data.length, 6)
assert.equal(mariaTasks.data.length, 3)
assert.equal(ilyaTasks.data.length, 3)

const foreignTask = ilyaTasks.data[0]
const foreignRead = await maria.from('tasks').select('id').eq('id', foreignTask.id)
assert.ifError(foreignRead.error)
assert.equal(foreignRead.data.length, 0)

const directStatus = await maria.from('tasks').update({ status: 'accepted' }).eq('id', mariaTasks.data[0].id)
assert.ok(directStatus.error, 'Direct status update must be denied')

const fakeHistory = await maria.from('task_status_history').insert({
  task_id: mariaTasks.data[0].id, actor_id: mariaTasks.data[0].assignee_id,
  from_status: 'new', to_status: 'accepted',
})
assert.ok(fakeHistory.error, 'Direct history insert must be denied')

const roleElevation = await maria.from('profiles').update({ role: 'manager' }).eq('id', mariaTasks.data[0].assignee_id)
assert.ok(roleElevation.error, 'Role elevation must be denied')

const reviewTask = managerTasks.data.find(task => task.status === 'review')
assert.ok(reviewTask)
const missingComment = await manager.rpc('transition_task', { p_task_id: reviewTask.id, p_to_status: 'revision', p_comment: '' })
assert.ok(missingComment.error, 'Revision without a comment must be denied')
const forbiddenTransition = await maria.rpc('transition_task', { p_task_id: reviewTask.id, p_to_status: 'accepted', p_comment: null })
assert.ok(forbiddenTransition.error, 'Executor acceptance must be denied')

let temporaryObjectId
try {
  const created = await manager.from('objects').insert({ name: 'RLS test object', address: 'Только для постановщика' }).select('id').single()
  assert.ifError(created.error)
  temporaryObjectId = created.data.id
  const hiddenObject = await maria.from('objects').select('id').eq('id', temporaryObjectId)
  assert.ifError(hiddenObject.error)
  assert.equal(hiddenObject.data.length, 0)
} finally {
  if (temporaryObjectId) {
    const removed = await manager.from('objects').delete().eq('id', temporaryObjectId)
    assert.ifError(removed.error)
  }
}

console.log('Security checks passed: role visibility, direct writes, transitions, and object access')
