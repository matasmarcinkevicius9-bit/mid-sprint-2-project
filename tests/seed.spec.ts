import { test, expect } from './fixtures';

test('seed', async ({ page }) => {
  // The fixture opens the home page and signs in. Planning and generation
  // sessions pause on the line below and start from there.
  await expect(page).toHaveURL(/\/notes$/);
});
