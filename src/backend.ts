import { createClient } from '@supabase/supabase-js'
import type { HistoryItem, ObjectItem, Status, Store, Task, User } from './data'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && publishableKey ? createClient(url, publishableKey) : null

type ProfileRow = { id: string; full_name: string; role: User['role'] }
type ObjectRow = { id: string; name: string; address: string; created_at: string }
type TaskRow = { id: string; title: string; description: string; object_id: string; assignee_id: string; author_id: string; status: Status; created_at: string }
type HistoryRow = { id: string; task_id: string; actor_id: string; from_status: Status | null; to_status: Status; comment: string | null; created_at: string }

function requireClient() {
  if (!supabase) throw new Error('Supabase не настроен')
  return supabase
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function loadWorkspace(): Promise<{ store: Store; users: User[] }> {
  const client = requireClient()
  const [profileResult, objectResult, taskResult, historyResult] = await Promise.all([
    client.from('profiles').select('id,full_name,role').order('full_name'),
    client.from('objects').select('id,name,address,created_at').order('created_at', { ascending: false }),
    client.from('tasks').select('id,title,description,object_id,assignee_id,author_id,status,created_at').order('created_at', { ascending: false }),
    client.from('task_status_history').select('id,task_id,actor_id,from_status,to_status,comment,created_at').order('created_at'),
  ])
  check(profileResult.error); check(objectResult.error); check(taskResult.error); check(historyResult.error)

  const directory: User[] = ((profileResult.data ?? []) as ProfileRow[]).map((row, index) => ({
    id: row.id,
    name: row.full_name,
    initials: row.full_name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join(''),
    role: row.role,
    color: ['sand', 'lavender', 'mint'][index % 3],
  }))
  const objects: ObjectItem[] = ((objectResult.data ?? []) as ObjectRow[]).map(row => ({ id: row.id, name: row.name, address: row.address, createdAt: row.created_at }))
  const historyByTask = new Map<string, HistoryItem[]>()
  for (const row of (historyResult.data ?? []) as HistoryRow[]) {
    const history = historyByTask.get(row.task_id) ?? []
    history.push({ id: row.id, actorId: row.actor_id, from: row.from_status, to: row.to_status, at: row.created_at, ...(row.comment ? { comment: row.comment } : {}) })
    historyByTask.set(row.task_id, history)
  }
  const tasks: Task[] = ((taskResult.data ?? []) as TaskRow[]).map(row => ({
    id: row.id, title: row.title, description: row.description, objectId: row.object_id,
    assigneeId: row.assignee_id, authorId: row.author_id, status: row.status,
    createdAt: row.created_at, history: historyByTask.get(row.id) ?? [],
  }))
  return { store: { objects, tasks }, users: directory }
}

export async function createObject(input: { name: string; address: string }) {
  const { error } = await requireClient().from('objects').insert(input)
  check(error)
}

export async function updateObject(id: string, input: { name: string; address: string }) {
  const { error } = await requireClient().from('objects').update(input).eq('id', id)
  check(error)
}

export async function deleteObject(id: string) {
  const { error } = await requireClient().from('objects').delete().eq('id', id)
  check(error)
}

export async function createTask(input: { title: string; description: string; objectId: string; assigneeId: string; authorId: string }) {
  const { error } = await requireClient().from('tasks').insert({
    title: input.title, description: input.description, object_id: input.objectId,
    assignee_id: input.assigneeId, author_id: input.authorId,
  })
  check(error)
}

export async function updateTask(id: string, input: { title: string; description: string; objectId: string; assigneeId: string }) {
  const { error } = await requireClient().from('tasks').update({
    title: input.title, description: input.description, object_id: input.objectId, assignee_id: input.assigneeId,
  }).eq('id', id)
  check(error)
}

export async function deleteTask(id: string) {
  const { error } = await requireClient().from('tasks').delete().eq('id', id)
  check(error)
}

export async function transitionTask(id: string, to: Status, comment: string) {
  const { error } = await requireClient().rpc('transition_task', { p_task_id: id, p_to_status: to, p_comment: comment || null })
  check(error)
}
