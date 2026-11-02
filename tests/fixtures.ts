import { test as baseTest } from '@playwright/test';
import { signIn } from './helpers';

export { expect } from '@playwright/test';

// Every scenario starts on /notes, signed in as the test account.
export const test = baseTest.extend({
  // Named `provide` rather than Playwright's usual `use`, which oxlint's
  // React rules mistake for a hook.
  page: async ({ page }, provide) => {
    await signIn(page);
    await provide(page);
  },
});
