# Add Task Test Plan

## Application Overview

The notes workspace lists a signed-in user's notes. A "task" is a note: the
New note button creates an empty note and opens it in the editor, and the
title typed there is saved automatically about half a second after typing
stops. There is no submit button, so submitting means letting that autosave
finish. Users rely on new items appearing in the list straight away.

## Test Scenarios

### 1. Adding tasks

**Seed:** `tests/seed.spec.ts`

#### 1.1. should-add-buy-milk-task

**File:** `tests/add-task/should-add-buy-milk-task.spec.ts`

**Steps:**
  1. Open the home page and sign in
    - expect: the notes workspace is shown
  2. Click the New note button
    - expect: an empty note opens in the editor with a "Note title" field
  3. Type "buy milk" into the note title
    - expect: the title field holds "buy milk"
  4. Submit by letting the title autosave
    - expect: the save request succeeds
  5. Look at the note list
    - expect: a note titled "buy milk" is listed
