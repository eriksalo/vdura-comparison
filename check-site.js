import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Get console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER LOG:', text);
    logs.push(text);
  });

  await page.goto('http://localhost:5174');

  // Wait for simulation to start and write some checkpoints
  console.log('Waiting for simulation to start...');
  await page.waitForTimeout(5000);

  // Check for checkpoint logs
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'screenshot.png', fullPage: true });

  // Get dimensions from the page
  const dimensions = await page.evaluate(() => {
    const vduraSSD = document.querySelector('.vdura-system .storage-unit.vpod');
    const vduraHDD = document.querySelector('.vdura-system .storage-unit.jbod');

    if (!vduraSSD || !vduraHDD) return null;

    const ssdRect = vduraSSD.getBoundingClientRect();
    const hddRect = vduraHDD.getBoundingClientRect();

    // Get CSS custom properties
    const ssdStyles = getComputedStyle(vduraSSD);
    const hddStyles = getComputedStyle(vduraHDD);

    return {
      ssd: {
        cssWidth: ssdStyles.getPropertyValue('--cylinder-width'),
        cssHeight: ssdStyles.getPropertyValue('--cylinder-height'),
        renderedWidth: ssdRect.width,
        renderedHeight: ssdRect.height,
        renderedArea: ssdRect.width * ssdRect.height
      },
      hdd: {
        cssWidth: hddStyles.getPropertyValue('--cylinder-width'),
        cssHeight: hddStyles.getPropertyValue('--cylinder-height'),
        renderedWidth: hddRect.width,
        renderedHeight: hddRect.height,
        renderedArea: hddRect.width * hddRect.height
      }
    };
  });

  console.log('Dimensions:', JSON.stringify(dimensions, null, 2));

  if (dimensions) {
    const cssAreaSSD = parseFloat(dimensions.ssd.cssWidth) * parseFloat(dimensions.ssd.cssHeight);
    const cssAreaHDD = parseFloat(dimensions.hdd.cssWidth) * parseFloat(dimensions.hdd.cssHeight);
    const cssAreaRatio = cssAreaHDD / cssAreaSSD;

    const renderedAreaRatio = dimensions.hdd.renderedArea / dimensions.ssd.renderedArea;

    console.log('\nCSS dimensions area ratio:', cssAreaRatio.toFixed(2));
    console.log('Rendered visual area ratio:', renderedAreaRatio.toFixed(2));
    console.log('Expected capacity ratio: 4.76');
  }

  await browser.close();
})();
