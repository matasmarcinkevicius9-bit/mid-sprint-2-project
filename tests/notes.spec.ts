import { test, expect, type Page } from '@playwright/test';

function waitForNotesRequest(page: Page, method: 'PATCH' | 'DELETE') {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/rest/v1/notes') &&
      response.request().method() === method &&
      response.ok(),
  );
}

test('a new note is still visible after refreshing', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD in .env.e2e.local');
  }

  // Unique per run, so a note left by an earlier failed run cannot make this pass.
  const title = `Playwright note ${Date.now()}`;

  // The home page sends signed-out visitors to /signin.
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  // The dev server may need to compile /notes on first visit.
  await expect(page).toHaveURL(/\/notes$/, { timeout: 20_000 });

  await page.getByRole('button', { name: 'New note' }).click();

  // Edits autosave after a delay, so wait for the write before refreshing.
  const saved = waitForNotesRequest(page, 'PATCH');
  await page.getByLabel('Note title').fill(title);
  await saved;

  await page.reload();

  // Nothing is selected after a refresh, so this can only match the note list.
  const note = page.getByRole('button', { name: title });
  await expect(note).toBeVisible();

  // Remove the note so runs do not pile up in the test account.
  await note.click();
  page.once('dialog', (dialog) => dialog.accept());
  const deleted = waitForNotesRequest(page, 'DELETE');
  await page.getByRole('button', { name: 'Delete note' }).click();
  await deleted;
});
