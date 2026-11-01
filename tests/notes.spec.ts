import { test, expect, type Locator, type Page } from '@playwright/test';

function waitForNotesRequest(page: Page, method: 'PATCH' | 'DELETE') {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/rest/v1/notes') &&
      response.request().method() === method &&
      response.ok(),
  );
}

async function signIn(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD in .env.e2e.local');
  }

  // The home page sends signed-out visitors to /signin.
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  // The dev server may need to compile /notes on first visit.
  await expect(page).toHaveURL(/\/notes$/, { timeout: 20_000 });
  // The count replaces "Loading" only once React is running in the browser.
  // A click before then is lost, because the buttons have no handlers yet.
  await expect(page.getByText(/^\d+ notes?$/)).toBeVisible({ timeout: 20_000 });
}

// Edits autosave after a delay, so wait for the write before moving on.
async function setTitleAndWaitForSave(page: Page, title: string) {
  const saved = waitForNotesRequest(page, 'PATCH');
  await page.getByLabel('Note title').fill(title);
  await saved;
}

// Remove the note so runs do not pile up in the test account.
async function deleteNote(page: Page, note: Locator) {
  await note.click();
  page.once('dialog', (dialog) => dialog.accept());
  const deleted = waitForNotesRequest(page, 'DELETE');
  await page.getByRole('button', { name: 'Delete note' }).click();
  await deleted;
}

test('a new note is still visible after refreshing', async ({ page }) => {
  // Unique per run, so a note left by an earlier failed run cannot make this pass.
  const title = `Playwright note ${Date.now()}`;

  await signIn(page);
  await page.getByRole('button', { name: 'New note' }).click();
  await setTitleAndWaitForSave(page, title);

  await page.reload();

  // Nothing is selected after a refresh, so this can only match the note list.
  const note = page.getByRole('button', { name: title });
  await expect(note).toBeVisible();

  await deleteNote(page, note);
});

test('an edited note title is still correct after reloading', async ({ page }) => {
  const runId = Date.now();
  const originalTitle = `Playwright original ${runId}`;
  const editedTitle = `Playwright edited ${runId}`;

  await signIn(page);
  await page.getByRole('button', { name: 'New note' }).click();
  await setTitleAndWaitForSave(page, originalTitle);

  // Reload so the edit happens on a saved note opened from the list.
  await page.reload();
  await page.getByRole('button', { name: originalTitle }).click();
  await expect(page.getByLabel('Note title')).toHaveValue(originalTitle);

  await setTitleAndWaitForSave(page, editedTitle);

  await page.reload();

  // The list must show the new title in place of the old one, not beside it.
  const note = page.getByRole('button', { name: editedTitle });
  await expect(note).toBeVisible();
  await expect(page.getByRole('button', { name: originalTitle })).toHaveCount(0);

  // Reopening reads the title back from the saved note.
  await note.click();
  await expect(page.getByLabel('Note title')).toHaveValue(editedTitle);

  await deleteNote(page, note);
});
