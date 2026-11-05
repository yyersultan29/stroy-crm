import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const credentials = Object.fromEntries(readFileSync('.env.demo', 'utf8').trim().split('\n').map(line => line.split('=', 2)))
const baseUrl = process.env.CRM_URL ?? 'https://stroy-crm-seven.vercel.app'
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))

async function signIn(role) {
  await page.getByRole('textbox', { name: 'Email' }).fill(credentials[`DEMO_${role}_EMAIL`])
  await page.getByLabel('Пароль').fill(credentials[`DEMO_${role}_PASSWORD`])
  await page.getByRole('button', { name: 'Войти в систему' }).click()
  try {
    await page.getByRole('heading', { name: 'Обзор' }).waitFor({ timeout: 10000 })
  } catch (error) {
    console.error('Page after login:', (await page.locator('main').innerText()).slice(0, 500))
    throw error
  }
}

try {
  await page.goto(baseUrl)
  await signIn('MANAGER')
  await page.getByRole('button', { name: 'Новый объект' }).click()
  assert.equal(await page.getByRole('dialog', { name: 'Форма объекта' }).count(), 1)
  await page.getByRole('button', { name: 'Закрыть' }).click()
  await page.locator('.nav__item').filter({ hasText: 'Все задачи' }).click()
  await page.getByRole('button', { name: 'Новая задача' }).click()
  assert.equal(await page.getByRole('dialog', { name: 'Форма задачи' }).count(), 1)
  await page.getByRole('button', { name: 'Закрыть' }).click()
  assert.ok(await page.locator('.task-row').count() >= 6)
  await page.locator('.task-row').filter({ has: page.locator('.status--review') }).first().click()
  assert.equal(await page.getByRole('button', { name: 'Принять задачу' }).count(), 1)
  assert.equal(await page.getByRole('button', { name: 'Вернуть на доработку' }).isDisabled(), true)
  await page.getByRole('button', { name: 'Закрыть' }).click()
  await page.getByRole('button', { name: 'Сменить пользователя' }).click()
  await page.getByRole('button', { name: 'Выйти из системы' }).click()
  await page.getByRole('button', { name: 'Войти в систему' }).waitFor()

  await signIn('MARIA')
  await page.locator('.nav__item').filter({ hasText: 'Мои задачи' }).click()
  assert.ok(await page.locator('.task-row').count() >= 3)
  assert.equal(await page.locator('.page-heading__action').count(), 0)
  await page.locator('.task-row').filter({ has: page.locator('.status--revision') }).first().click()
  assert.equal(await page.getByRole('button', { name: 'Взять в работу' }).count(), 1)
  assert.deepEqual(errors, [])
  console.log('UI checks passed: login, forms, task visibility, actions')
} finally {
  await browser.close()
}
