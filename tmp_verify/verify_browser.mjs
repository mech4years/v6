import { chromium } from 'playwright';

const url = 'http://localhost:3000';
const browser = await chromium.launch({
  executablePath: '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
  ],
});

const errors = [];
const failedRequests = [];

try {
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1', { timeout: 15000 });
  await page.waitForTimeout(800);

  // 1. Open SETTINGS and verify 5 Graphics Quality presets
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const s = btns.find((b) => b.textContent && b.textContent.includes('SETTINGS'));
    if (!s) throw new Error('SETTINGS button not found');
    s.click();
  });
  await page.waitForSelector('text=GRAPHICS QUALITY', { timeout: 8000 });

  for (const label of ['LOW', 'MEDIUM', 'HIGH', 'ULTRA', 'CINEMATIC']) {
    const found = await page.evaluate((lbl) => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent && b.textContent.trim().toUpperCase() === lbl);
    }, label);
    if (!found) throw new Error(`Missing quality button: ${label}`);
  }

  // Click ULTRA, save screenshot of Settings modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const u = btns.find((b) => b.textContent && b.textContent.trim().toUpperCase() === 'ULTRA');
    u?.click();
  });
  await page.waitForTimeout(250);
  const settingsShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const fs = await import('fs');
  fs.writeFileSync('tmp_verify/settings.png', Buffer.from(settingsShot.data, 'base64'));

  // Close Settings -> Open Campaign Chapters -> Deploy Crucible Arena
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find((b) => b.textContent && b.textContent.toUpperCase().includes('CLOSE'))
      || btns.find((b) => b.querySelector('svg'));
    closeBtn?.click();
  });
  await page.waitForTimeout(250);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const ch = btns.find((b) => b.textContent && b.textContent.includes('CAMPAIGN CHAPTERS'));
    if (!ch) throw new Error('CAMPAIGN CHAPTERS button not found');
    ch.click();
  });
  await page.waitForTimeout(350);

  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div'));
    const crucibleCard = cards.find((d) =>
      d.textContent && d.textContent.includes('THE TITANFORGED') && d.querySelector('button')
    );
    const btn = crucibleCard?.querySelector('button');
    if (!btn) throw new Error('Crucible deploy button not found');
    btn.click();
  });

  // Wait for Boss HUD ('THE TITANFORGED') and WebGL scene to initialize & render
  await page.waitForSelector('text=THE TITANFORGED', { timeout: 15000 });
  await page.waitForTimeout(1600);

  // Move forward toward boss, fire weapon, and wait for boss engagement / attack
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1800);
  await page.keyboard.up('KeyW');
  await page.mouse.move(480, 270);
  await page.mouse.down({ button: 'left' });
  await page.waitForTimeout(450);
  await page.mouse.up({ button: 'left' });
  await page.waitForTimeout(1600);

  const hudText = await page.evaluate(() => document.body.innerText);
  console.log('CRUCIBLE HUD VISIBLE:', hudText.includes('THE TITANFORGED'));

  const crucibleShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tmp_verify/crucible.png', Buffer.from(crucibleShot.data, 'base64'));

  if (errors.length > 0) {
    throw new Error('Runtime errors detected:\n' + errors.join('\n'));
  }
  if (failedRequests.length > 0) {
    throw new Error('Failed HTTP requests:\n' + failedRequests.join('\n'));
  }
  console.log('PLAYWRIGHT VERIFICATION PASSED CLEANLY!');
} finally {
  await browser.close();
}
