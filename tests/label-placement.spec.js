import { test, expect } from '@playwright/test';

test('SSD layer labels should be positioned above cylinders', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Find all SSD layer labels with the unit-label-top class
  const vduraLabel = page.locator('.vdura-system .unit-label-top').first();
  const competitorLabel = page.locator('.competitor-system .unit-label-top').first();

  // Verify labels exist
  await expect(vduraLabel).toBeVisible();
  await expect(competitorLabel).toBeVisible();

  // Verify labels contain expected text
  await expect(vduraLabel).toContainText('SSD Layer');
  await expect(competitorLabel).toContainText('SSD Layer');

  // Verify labels show node count
  await expect(vduraLabel).toContainText('Nodes');
  await expect(competitorLabel).toContainText('Nodes');

  // Verify labels show capacity in PB
  await expect(vduraLabel).toContainText('PB');
  await expect(competitorLabel).toContainText('PB');

  // Verify labels show percentage full
  await expect(vduraLabel).toContainText('% Full');
  await expect(competitorLabel).toContainText('% Full');

  // Get the position of the labels and cylinders
  const vduraCylinder = page.locator('.vdura-system .storage-unit.single-tank.vpod').first();
  const competitorCylinder = page.locator('.competitor-system .storage-unit.single-tank.competitor').first();

  // Get bounding boxes
  const vduraLabelBox = await vduraLabel.boundingBox();
  const vduraCylinderBox = await vduraCylinder.boundingBox();
  const competitorLabelBox = await competitorLabel.boundingBox();
  const competitorCylinderBox = await competitorCylinder.boundingBox();

  // Verify labels are positioned above cylinders (label's bottom Y < cylinder's top Y)
  expect(vduraLabelBox.y + vduraLabelBox.height).toBeLessThan(vduraCylinderBox.y);
  expect(competitorLabelBox.y + competitorLabelBox.height).toBeLessThan(competitorCylinderBox.y);

  console.log('✓ VDURA label is positioned above cylinder');
  console.log('✓ Competitor label is positioned above cylinder');
  console.log('✓ All labels contain expected information');
});
