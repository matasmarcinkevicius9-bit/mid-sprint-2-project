import { test, expect } from '@playwright/test';
import { deleteNote, setTitleAndWaitForSave, signIn } from './helpers';

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
