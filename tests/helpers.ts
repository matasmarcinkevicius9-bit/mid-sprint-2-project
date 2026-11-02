import { expect, type Locator, type Page } from '@playwright/test';

export function waitForNotesRequest(page: Page, method: 'PATCH' | 'DELETE') {
  return page.waitForResponse(
    (response) =>
      response.url().includes('/rest/v1/notes') &&
      response.request().method() === method &&
      response.ok(),
  );
}

export async function signIn(page: Page) {
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
export async function setTitleAndWaitForSave(page: Page, title: string) {
  const saved = waitForNotesRequest(page, 'PATCH');
  await page.getByLabel('Note title').fill(title);
  await saved;
}

// Remove the note so runs do not pile up in the test account.
export async function deleteNote(page: Page, note: Locator) {
  await note.click();
  page.once('dialog', (dialog) => dialog.accept());
  const deleted = waitForNotesRequest(page, 'DELETE');
  await page.getByRole('button', { name: 'Delete note' }).click();
  await deleted;
}
