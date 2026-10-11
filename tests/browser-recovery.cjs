const assert = require('node:assert/strict');
const fs = require('node:fs');
const playwright = require('playwright');
const url = process.env.MVP_URL || 'http://127.0.0.1:4173/';
async function checkFocus(page, selector, reason) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  assert.equal(await page.evaluate(s => document.activeElement.matches(s), selector), true, reason);
}
async function book(page, id = 'd01') {
  await page.locator(`.dress-card[data-id="${id}"] .dress-open`).click();
  await page.locator('[data-size="S"]').click();
  await page.locator('#reserve-look-button').click();
  await page.locator('#guest-name').fill('Casey Guest');
  await page.locator('#guest-email').fill('casey@example.com');
  await page.locator('#confirm-reservation').click();
}
async function switchRoom(page, code) {
  await page.locator('#change-wedding').click();
  await page.locator('#wedding-code').fill(code);
  await page.locator('#join-wedding-button').click();
}
(async () => {
  const options = { headless: true };
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  if (fs.existsSync(edge)) options.executablePath = edge;
  const browser = await playwright.chromium.launch(options);
  const failures = [];
  async function scenario(name, action, storageMode) {
    const context = await browser.newContext();
    if (storageMode) await context.addInitScript(mode => {
      if (mode === 'blocked') Storage.prototype.getItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
      Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); };
    }, storageMode);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await action(page);
      console.log(`PASS: ${name}`);
    } catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL: ${name}: ${error.message}`); }
    finally { await context.close(); }
  }
  try {
    await scenario('keyboard focus survives saving a card and removing a favorite', async page => {
      const heart = page.locator('.dress-card[data-id="d01"] .save-look');
      await heart.focus(); await page.keyboard.press('Enter');
      await checkFocus(page, '.dress-card[data-id="d01"] .save-look', 'updated heart retains focus');
      await page.locator('#my-looks-button').click();
      await page.locator('#my-looks-list [data-save-look="d01"]').click();
      await checkFocus(page, '#my-tab-saved', 'removing the final favorite returns focus to the saved tab');
    });
    await scenario('checkout, confirmation, Escape and cancellation have usable focus', async page => {
      await page.locator('.dress-card[data-id="d01"] .dress-open').click();
      await page.locator('[data-size="S"]').click();
      await page.locator('#reserve-look-button').click();
      await checkFocus(page, '#guest-name', 'checkout moves focus to guest name');
      await page.locator('#guest-name').fill('Casey Guest');
      await page.locator('#guest-email').fill('casey@example.com');
      await page.locator('#confirm-reservation').click();
      await checkFocus(page, '#look-title', 'confirmation title receives focus');
      await page.keyboard.press('Escape');
      await checkFocus(page, '.dress-card[data-id="d01"] .dress-open', 'Escape restores the replaced catalog opener');
      await page.locator('#my-looks-button').click();
      await page.locator('[data-my-tab="reservations"]').click();
      await page.locator('[data-cancel-booking]').click();
      await page.locator('#confirm-cancel').click();
      await checkFocus(page, '#my-tab-reservations', 'cancellation returns focus to the reservations tab');
    });
    for (const mode of ['blocked', 'quota']) await scenario(`${mode} storage preserves per-room data for the visit`, async page => {
      await page.locator('.dress-card[data-id="d01"] .save-look').click();
      await book(page);
      await page.keyboard.press('Escape');
      await switchRoom(page, 'ON2027');
      assert.equal(await page.locator('#saved-count').innerText(), '0');
      assert.doesNotMatch(await page.locator('.dress-card[data-id="d01"]').innerText(), /Reserved by you/);
      await switchRoom(page, 'EJ2027');
      assert.equal(await page.locator('#saved-count').innerText(), '1', 'favorite survives room round trip');
      assert.match(await page.locator('.dress-card[data-id="d01"]').innerText(), /Reserved by you/, 'reservation survives room round trip');
      await page.locator('.dress-card[data-id="d01"] .dress-open').click();
      assert.equal(await page.locator('#reserve-look-button').isDisabled(), true, 'duplicate reservation stays blocked');
      await page.keyboard.press('Escape');
      await page.locator('#my-looks-button').click();
      await page.locator('[data-my-tab="reservations"]').click();
      await page.locator('[data-cancel-booking]').click();
      await page.locator('#confirm-cancel').click();
      await page.keyboard.press('Escape');
      assert.doesNotMatch(await page.locator('.dress-card[data-id="d01"]').innerText(), /Reserved by you/, 'fallback reservation can be canceled');
    }, mode);
    if (failures.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
