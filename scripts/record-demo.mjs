import assert from 'node:assert/strict'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const parseEnv = text => Object.fromEntries(text.trim().split('\n').filter(line => line.includes('=') && !line.startsWith('#')).map(line => line.split('=', 2)))
const env = { ...parseEnv(await readFile('.env.local', 'utf8')), ...parseEnv(await readFile('.env.demo', 'utf8')) }
const baseUrl = 'https://stroy-crm-seven.vercel.app'
const taskTitle = 'Проверить фасадные панели'

const api = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const signedIn = await api.auth.signInWithPassword({ email: env.DEMO_MANAGER_EMAIL, password: env.DEMO_MANAGER_PASSWORD })
assert.ifError(signedIn.error)
const cleanup = await api.from('tasks').delete().eq('title', taskTitle)
assert.ifError(cleanup.error)

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const errors = []

async function storageFor(role) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(baseUrl)
  await page.getByRole('textbox', { name: 'Email' }).fill(env[`DEMO_${role}_EMAIL`])
  await page.getByLabel('Пароль').fill(env[`DEMO_${role}_PASSWORD`])
  await page.getByRole('button', { name: 'Войти в систему' }).click()
  await page.getByRole('heading', { name: 'Обзор' }).waitFor()
  const state = await context.storageState()
  await context.close()
  return state
}

const managerState = await storageFor('MANAGER')
const mariaState = await storageFor('MARIA')
const timings = []

async function recordStep(number, title, duration, state, actions) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    storageState: state,
    recordVideo: { dir: 'deliverables/work', size: { width: 1600, height: 900 } },
  })
  const page = await context.newPage()
  const createdAt = Date.now()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(baseUrl)
  await page.getByRole('heading', { name: 'Обзор' }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(({ number, title }) => {
    const label = document.createElement('div')
    label.id = 'video-step-label'
    label.textContent = `Шаг ${number} — ${title}`
    label.style.cssText = 'position:fixed;left:272px;bottom:22px;z-index:100;pointer-events:none;background:#172e2de8;color:white;padding:11px 16px;border-radius:6px;font:700 14px Manrope,Arial,sans-serif;box-shadow:0 8px 24px #14262228'
    document.body.appendChild(label)
  }, { number, title })
  const offset = (Date.now() - createdAt) / 1000
  const start = Date.now()
  const at = async seconds => page.waitForTimeout(Math.max(0, seconds * 1000 - (Date.now() - start)))
  await actions(page, at)
  await at(duration)
  const video = page.video()
  await context.close()
  const rawPath = await video.path()
  const outputPath = `deliverables/work/raw-step-${number}.webm`
  await copyFile(rawPath, outputPath)
  timings.push({ number, duration, offset, path: outputPath })
  console.log(`Recorded step ${number}: ${duration}s, trim offset ${offset.toFixed(2)}s`)
}

try {
  await recordStep(1, 'Объекты', 20.5, managerState, async (page, at) => {
    await at(3)
    await page.locator('.nav__item').filter({ hasText: 'Объекты' }).click()
    await at(6)
    await page.locator('.object-row').filter({ hasText: 'ЖК «Горизонт»' }).click()
    await at(11)
    await page.locator('.task-row').first().click()
    await at(16)
    await page.getByRole('button', { name: 'Закрыть' }).click()
  })

  await recordStep(2, 'Постановка задачи', 19, managerState, async (page, at) => {
    await at(1)
    await page.locator('.nav__item').filter({ hasText: 'Объекты' }).click()
    await at(3)
    await page.locator('.object-row').filter({ hasText: 'ЖК «Горизонт»' }).click()
    await at(5)
    await page.getByRole('button', { name: 'Новая задача' }).click()
    await at(6)
    await page.getByLabel('Название задачи').fill(taskTitle)
    await page.getByLabel('Описание').fill('Проверить крепления фасадных панелей на секции А и передать результат на проверку.')
    await page.getByLabel('Исполнитель').selectOption({ label: 'Мария Ким' })
    await at(11)
    await page.getByRole('button', { name: 'Создать задачу' }).click()
    await page.locator('.task-row').filter({ hasText: taskTitle }).waitFor()
    await at(14)
    await page.locator('.task-row').filter({ hasText: taskTitle }).click()
  })

  await recordStep(3, 'Работа исполнителя', 18.5, mariaState, async (page, at) => {
    await at(1)
    await page.locator('.nav__item').filter({ hasText: 'Мои задачи' }).click()
    await at(4)
    await page.locator('.task-row').filter({ hasText: taskTitle }).click()
    await at(7)
    await page.getByRole('button', { name: 'Взять в работу' }).click()
    await page.getByRole('button', { name: 'Отправить на проверку' }).waitFor()
    await at(12)
    await page.getByRole('button', { name: 'Отправить на проверку' }).click()
    await at(15)
    await page.locator('.history').scrollIntoViewIfNeeded()
  })

  await recordStep(4, 'Проверка и защита', 27, managerState, async (page, at) => {
    await at(1)
    await page.locator('.nav__item').filter({ hasText: 'Все задачи' }).click()
    await at(4)
    await page.locator('.task-row').filter({ hasText: taskTitle }).click()
    await at(8)
    await page.getByRole('button', { name: 'Принять задачу' }).click()
    await at(12)
    await page.locator('.history').scrollIntoViewIfNeeded()
    await at(19)
    await page.evaluate(() => {
      const panel = document.createElement('div')
      panel.style.cssText = 'position:fixed;z-index:95;left:285px;top:220px;width:490px;background:#172e2df5;color:white;padding:28px 32px;border-radius:10px;box-shadow:0 22px 55px #10292132;font:600 18px Manrope,Arial,sans-serif;line-height:1.7'
      panel.innerHTML = '<div style="font-size:11px;letter-spacing:2px;color:#df9075;font-weight:800;margin-bottom:14px">ЗАЩИТА ДАННЫХ</div><div>✓ Чужие задачи недоступны</div><div>✓ История защищена</div><div>✓ Регистрация закрыта</div>'
      document.body.appendChild(panel)
    })
  })

  assert.deepEqual(errors, [])
  await writeFile('deliverables/work/timings.json', JSON.stringify(timings, null, 2))
  console.log('All four screen recordings completed')
} finally {
  await browser.close()
}
