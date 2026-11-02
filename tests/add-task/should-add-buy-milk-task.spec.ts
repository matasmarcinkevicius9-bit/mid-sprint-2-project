// spec: specs/add-task.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';
import { deleteNote, waitForNotesRequest } from '../helpers';

test.describe('Adding tasks', () => {
  test.afterEach(async ({ page }) => {
    // Remove the note so runs do not pile up in the test account.
    const listed = page.getByRole('list').getByRole('button', { name: 'buy milk' });
    if ((await listed.count()) > 0) await deleteNote(page, listed.first());
  });

  test('should add buy milk task', async ({ page }) => {
    // 1. Open the home page and sign in
    // (handled by the seed fixture)
    await expect(page.getByRole('button', { name: 'New note' })).toBeVisible();

    // 2. Click the New note button
    await page.getByRole('button', { name: 'New note' }).click();
    await expect(page.getByRole('textbox', { name: 'Note title' })).toBeEmpty();

    // 3. Type "buy milk" into the note title
    // 4. Submit by letting the title autosave
    const saved = waitForNotesRequest(page, 'PATCH');
    await page.getByRole('textbox', { name: 'Note title' }).fill('buy milk');
    await expect(page.getByRole('textbox', { name: 'Note title' })).toHaveValue('buy milk');
    await saved;

    // 5. Look at the note list
    await expect(page.getByRole('list').getByRole('button', { name: 'buy milk' })).toBeVisible();
  });
});
