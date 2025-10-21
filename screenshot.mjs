import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to a reasonable size
  await page.setViewportSize({ width: 1920, height: 1200 });

  // Navigate to the local dev server
  await page.goto('http://localhost:5175');

  // Wait for the app to load
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'visualization-screenshot.png', fullPage: true });

  console.log('Screenshot saved to visualization-screenshot.png');

  await browser.close();
})();
