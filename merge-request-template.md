This is a file meant to be used by Cursor to write pull request titles and
descriptions.

To ask it to write a pull request description, use the `/loom-mr` command or
prompt:

```
Can you create or edit temp.md, following the template in
merge-request-template.md, based on the changes between the current branch and
main? Replace all example text with text corresponding to the actual changes.

Use bullets and sub-bullets to make it clearer how changes build up, but try to
avoid sub-bullets for small changes.

For the motivation section, use the below text verbatim:

<fill this in manually: use \ if adding newlines>
```

Example below:

# Title: Add PDF upload dropzone to landing page

## Motivation

Build a free, open-source AI PDF redaction site where users can upload a PDF,
let AI find PII, review and adjust boxes, and download the redacted result.

## Changes

<replace the below: it's an example>

- Add a landing page upload dropzone with drag-and-drop support
- Wire the dropzone to the existing upload API route

## Testing

<replace the below: it's an example>

- Automated tests
  - Add the exact test command(s) you ran, including the full path/file when applicable.
    - Example: `yarn jest path/to/test-file.test.ts`
- Manual verification steps (copy/paste exactly if possible so another engineer can rerun)
  - Run from repo root: `yarn storybook`
  - Open a fresh browser window at `http://localhost:6006` and run through each step in order:
    1. Visit `http://localhost:6006/iframe.html?path=...` or the target story path in the Storybook UI
    2. Perform action(s): `[describe each click/input/selection in sequence]`
    3. Capture expected result for each step: `[describe exact UI/text/state change]`
    4. Record any follow-up navigation and repeat checks: `[list concrete URLs and actions]`
  - Include edge and rollback checks if relevant, such as clearing cache, hard reload, or verifying error states.
- Artifact evidence
  - If any testing screenshot, image, or screen capture was taken, embed it directly here using Markdown.
  - Example:
    - `![Manual test screenshot 1](./artifacts/manual-test-1.png)`
    - `![Manual test video 2](./artifacts/manual-test-2.gif)`
  - If an image/video is too large for inline display, include a short note with where the original asset lives.
