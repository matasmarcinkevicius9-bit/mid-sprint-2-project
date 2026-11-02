import { test, expect } from '@playwright/test';
import { deleteNote, setTitleAndWaitForSave, signIn } from './helpers';

// Row-level security means the real API only ever returns the signed-in
// user's notes, so a note owned by someone else cannot reach the list today.
// To test the filter, the browser's notes request is intercepted and one
// extra row owned by a different user is added to the real response.
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000001';

const runId = Date.now();
const myTitle = `My filter note ${runId}`;
const otherTitle = `Other user's note ${runId}`;

test.afterEach(async ({ page }) => {
  // Runs even when the test fails, so its real note never piles up.
  await page.reload();
  const mine = page.getByRole('button', { name: myTitle });
  if (await mine.isVisible()) await deleteNote(page, mine);
});

test('"Show only my notes" hides notes owned by other users', async ({ page }) => {
  await page.route(
    (url) => url.pathname === '/rest/v1/notes',
    async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const response = await route.fetch();
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) return route.fulfill({ response });
      // Copy a real row so the fake one has exactly the shape the API returns.
      const otherUsersNote = {
        ...rows[0],
        id: '00000000-0000-4000-8000-000000000002',
        user_id: OTHER_USER_ID,
        collection_id: null,
        title: otherTitle,
        content: 'Written by someone else',
        note_tags: [],
        note_images: [],
      };
      return route.fulfill({ response, json: [...rows, otherUsersNote] });
    },
  );

  await signIn(page);
  await page.getByRole('button', { name: 'New note' }).click();
  await setTitleAndWaitForSave(page, myTitle);
  await page.reload();

  const myNote = page.getByRole('button', { name: myTitle });
  const otherNote = page.getByRole('button', { name: otherTitle });

  // Both are listed before filtering, so the setup above really worked.
  await expect(myNote).toBeVisible();
  await expect(otherNote).toBeVisible();

  await page.getByRole('button', { name: 'Show only my notes' }).click();

  await expect(otherNote).toBeHidden();
  await expect(myNote).toBeVisible();
});
