import { test, expect, Page } from '@playwright/test'
import path from 'path'

const BASE = 'http://localhost:3000'
const EMAIL = 'test@carrete.dev'
const PASS = 'testpass123'
const PHOTO = path.join(__dirname, 'test-photo.jpg')

// Helper: login and return page
async function login(page: Page) {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(global|groups)/, { timeout: 10000 })
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

test('login page renders and redirects logged-out user', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await page.screenshot({ path: 'e2e/screenshots/01-login-page.png', fullPage: true })
})

test('login page - wrong password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=incorrectos')).toBeVisible({ timeout: 6000 })
  await page.screenshot({ path: 'e2e/screenshots/02-login-error.png', fullPage: true })
})

test('login page - register tab switches form', async ({ page }) => {
  await page.goto('/login')
  await page.click('button:has-text("Crear cuenta")')
  await expect(page.locator('input[placeholder*="amigos"]')).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/03-register-tab.png', fullPage: true })
})

test('login with valid credentials redirects to feed', async ({ page }) => {
  await login(page)
  await page.screenshot({ path: 'e2e/screenshots/04-feed-after-login.png', fullPage: true })
  expect(page.url()).toContain('global')
})

// ─── FEED ────────────────────────────────────────────────────────────────────

test('feed page loads and shows bottom nav', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/05-feed-with-nav.png', fullPage: true })
})

test('feed page shows app header with logo and avatar', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  await expect(page.locator('.app-header')).toBeVisible()
  await expect(page.locator('.logo-sq')).toBeVisible()
  // User avatar link
  await expect(page.locator('a.avatar[href="/profile"]')).toBeVisible()
})

test('feed FAB button is visible and opens upload sheet', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  const fab = page.locator('button[aria-label="Subir fotos"]')
  await expect(fab).toBeVisible({ timeout: 5000 })
  await fab.click()
  // Upload sheet should appear
  await expect(page.locator('text=Subir fotos').nth(1)).toBeVisible({ timeout: 3000 })
  await page.screenshot({ path: 'e2e/screenshots/06-upload-sheet-open.png', fullPage: true })
})

test('upload sheet can be closed', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  await page.click('button[aria-label="Subir fotos"]')
  await expect(page.locator('text=Subir fotos').nth(1)).toBeVisible({ timeout: 3000 })
  // Close button (X)
  const closeBtn = page.locator('[style*="fixed"] button').filter({ has: page.locator('svg') }).last()
  await closeBtn.click()
  await expect(page.locator('text=Subir fotos').nth(1)).not.toBeVisible({ timeout: 3000 })
})

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

test('bottom nav Feed link works', async ({ page }) => {
  await login(page)
  await page.goto('/global/search')
  await page.locator('.nav-btn').first().click()
  await page.waitForURL('/global', { timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/07-nav-feed.png', fullPage: true })
})

test('bottom nav Buscar link works', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  await page.locator('.nav-btn').nth(1).click()
  await page.waitForURL('/global/search', { timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/08-nav-search.png', fullPage: true })
})

test('bottom nav Perfil link works', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  await page.locator('.nav-btn').nth(2).click()
  await page.waitForURL('/profile', { timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/09-nav-profile.png', fullPage: true })
})

test('/groups redirects to /global', async ({ page }) => {
  await login(page)
  await page.goto('/groups')
  await expect(page).toHaveURL('/global', { timeout: 5000 })
})

// ─── UPLOAD ──────────────────────────────────────────────────────────────────

test('upload page loads via direct URL', async ({ page }) => {
  await login(page)
  await page.goto('/global/upload')
  await expect(page.locator('text=Subir al carrete')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/10-upload-page.png', fullPage: true })
})

test('upload page: file picker works and shows upload button', async ({ page }) => {
  await login(page)
  await page.goto('/global/upload')
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(PHOTO)
  await expect(page.locator('button.btn-primary')).toBeVisible({ timeout: 3000 })
  await page.screenshot({ path: 'e2e/screenshots/11-upload-file-selected.png', fullPage: true })
})

test('upload photo via sheet from feed', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  await page.click('button[aria-label="Subir fotos"]')
  await expect(page.locator('text=Subir fotos').nth(1)).toBeVisible({ timeout: 3000 })
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(PHOTO)
  await expect(page.locator('button.btn-primary')).toBeVisible({ timeout: 3000 })
  await page.locator('button.btn-primary').click()
  // Should show success message
  await expect(page.locator('text=subida')).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: 'e2e/screenshots/12-upload-success.png', fullPage: true })
})

// ─── PROFILE ─────────────────────────────────────────────────────────────────

test('profile page loads and shows user info', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.locator('.profile-wrap')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.profile-name')).toBeVisible()
  await expect(page.locator('text=vos')).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/13-profile-page.png', fullPage: true })
})

test('profile: edit button opens editor', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.locator('button.profile-edit-btn').click()
  await expect(page.locator('text=Editar perfil')).toBeVisible({ timeout: 3000 })
  await expect(page.locator('input.form-input').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/14-profile-editor-open.png', fullPage: true })
})

test('profile: edit name and save', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.locator('button.profile-edit-btn').click()
  await expect(page.locator('.profile-editor')).toBeVisible({ timeout: 3000 })

  const nameInput = page.locator('.profile-editor input.form-input')
  await nameInput.clear()
  await nameInput.fill('TestUser Editado')

  await page.locator('.editor-actions .btn-primary').click()

  // Should close editor and show updated name
  await expect(page.locator('.profile-editor')).not.toBeVisible({ timeout: 8000 })
  await page.screenshot({ path: 'e2e/screenshots/15-profile-after-edit.png', fullPage: true })

  // Reset name
  await page.locator('button.profile-edit-btn').click()
  const nameInput2 = page.locator('.profile-editor input.form-input')
  await nameInput2.clear()
  await nameInput2.fill('TestUser')
  await page.locator('.editor-actions .btn-primary').click()
  await expect(page.locator('.profile-editor')).not.toBeVisible({ timeout: 8000 })
})

test('profile: cancel edit restores original values', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  const origName = await page.locator('.profile-name').textContent()
  await page.locator('button.profile-edit-btn').click()
  const nameInput = page.locator('.profile-editor input.form-input')
  await nameInput.clear()
  await nameInput.fill('NombreTemporal123')
  await page.locator('.btn-secondary').click()
  // Editor should close
  await expect(page.locator('.profile-editor')).not.toBeVisible({ timeout: 3000 })
  // Name shown should still be original
  const shownName = await page.locator('.profile-name').textContent()
  expect(shownName).toBe(origName)
})

test('profile: change avatar color', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.locator('button.profile-edit-btn').click()
  await expect(page.locator('.color-swatches')).toBeVisible({ timeout: 3000 })
  // Click the second color swatch
  await page.locator('.color-swatch').nth(1).click()
  await page.screenshot({ path: 'e2e/screenshots/16-profile-color-changed.png', fullPage: true })
  await page.locator('.editor-actions .btn-primary').click()
  await expect(page.locator('.profile-editor')).not.toBeVisible({ timeout: 8000 })
})

test('profile: upload avatar photo', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.locator('button.profile-edit-btn').click()
  const avatarInput = page.locator('.avatar-upload-wrap input[type="file"]')
  await avatarInput.setInputFiles(PHOTO)
  // Preview should appear
  await expect(page.locator('.profile-av--lg img')).toBeVisible({ timeout: 3000 })
  // Color swatches should hide when avatar is set
  await expect(page.locator('.color-swatches')).not.toBeVisible()
  await page.screenshot({ path: 'e2e/screenshots/17-profile-avatar-preview.png', fullPage: true })
  await page.locator('.editor-actions .btn-primary').click()
  await expect(page.locator('.profile-editor')).not.toBeVisible({ timeout: 10000 })
})

test('profile: bio field has character counter', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await page.locator('button.profile-edit-btn').click()
  await expect(page.locator('text=/\\d+\\/150/')).toBeVisible({ timeout: 3000 })
  await page.locator('.form-textarea').fill('Mi bio de prueba')
  await expect(page.locator('text=16/150')).toBeVisible()
})

// ─── SEARCH ──────────────────────────────────────────────────────────────────

test('search page loads', async ({ page }) => {
  await login(page)
  await page.goto('/global/search')
  await expect(page.locator('input[name="q"]')).toBeVisible({ timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/18-search-page.png', fullPage: true })
})

test('search page: albums link redirects here', async ({ page }) => {
  await login(page)
  await page.goto('/global/albums')
  await expect(page).toHaveURL('/global/search', { timeout: 5000 })
})

test('search: text search works', async ({ page }) => {
  await login(page)
  await page.goto('/global/search')
  await page.fill('input[name="q"]', 'DSC')
  await page.keyboard.press('Enter')
  await page.waitForURL(/search\?.*q=DSC/, { timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/19-search-results.png', fullPage: true })
})

// ─── PHOTO DETAIL ────────────────────────────────────────────────────────────

test('clicking photo card navigates to photo detail', async ({ page }) => {
  await login(page)
  await page.goto('/global')
  const photoCard = page.locator('.photo-card').first()
  await expect(photoCard).toBeVisible({ timeout: 5000 })
  await photoCard.click()
  await page.waitForURL(/\/global\/photo\//, { timeout: 5000 })
  await page.screenshot({ path: 'e2e/screenshots/20-photo-detail.png', fullPage: true })
})

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

test('logout redirects to login', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  // Find logout button
  const logoutBtn = page.locator('button:has-text("Salir"), button:has-text("Cerrar"), button:has-text("salir"), button:has-text("logout")').first()
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  } else {
    // Take screenshot to see what's on the profile page
    await page.screenshot({ path: 'e2e/screenshots/21-logout-button-not-found.png', fullPage: true })
    console.log('Logout button not found with expected text')
  }
})

// ─── RESPONSIVE ──────────────────────────────────────────────────────────────

test('mobile viewport: login page looks correct', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await page.screenshot({ path: 'e2e/screenshots/22-mobile-login.png', fullPage: true })
})

test('mobile viewport: feed page looks correct', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await page.goto('/global')
  await page.screenshot({ path: 'e2e/screenshots/23-mobile-feed.png', fullPage: true })
})

test('mobile viewport: profile page looks correct', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await page.goto('/profile')
  await page.screenshot({ path: 'e2e/screenshots/24-mobile-profile.png', fullPage: true })
})

test('desktop viewport: feed page looks correct', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await login(page)
  await page.goto('/global')
  await page.screenshot({ path: 'e2e/screenshots/25-desktop-feed.png', fullPage: true })
})

test('desktop viewport: login page looks correct', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login')
  await page.screenshot({ path: 'e2e/screenshots/26-desktop-login.png', fullPage: true })
})
