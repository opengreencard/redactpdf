# Convert Loom transcript to pull request description

Converts a Loom transcript into a pull request description by:

1. Formatting the transcript into a motivation section
2. Generating the full pull request description from the diff and commits

When this command is invoked, fetch the transcript and generate the PR without asking for any inputs (assume defaults):

1. Link to the Loom video
2. Use `origin/main` as the base branch (assume it is rebased)
3. Transcript of the Loom video (optional)
   - If transcript is not provided, use
     @.cursor/skills/fetch-loom-transcript/SKILL.md to fetch it from the Loom
     link

Then:

1. Read merge-request-template.md to get a sense of the format of the Motivation section.

2. Convert the transcript into a formatted Motivation section:

   - Use bullets, numbering, and subheadings for readability
   - Sentence-case for subheadings
   - Correct function/script names in the transcript by checking the codebase
   - Format: "Loom video: link" at the top of the Motivation section
   - Do not hard-wrap lines for max length; copied output keeps those breaks

3. Use the formatted motivation section verbatim

4. Generate "Changes" and "Testing" sections based on the diff between current
   branch and origin/main:

   - Link to the Loom video at the top of the "Motivation" section
   - Start with user-facing outcomes, then keep implementation details short.
   - Keep the section brief and scannable:
     - Lead with what users see or can do differently.
     - Add a light "how we did it" note only where useful.
     - Avoid overly many sub-bullets.
   - **Important**: Avoid sub-bullets for small changes and combine multiple
     highly related lines
   - Do not create bullets in the "Changes" section for any of these:
     - Newly installed packages
     - Files written to the docs folder
     - Changes to ensure-awaited-promises.js
   - Use simpler, concise, conversational language
   - Avoid using long words like "comprehensive"
   - Mention specific functions and broad areas rather than enumerating every file.
   - Avoid naming every changed file path; keep references to module-level areas unless
     a path is essential.
   - Only mention added tests and Storybook stories in the "Testing" section
   - In the "Testing" section, try to include specific shell commands to run or
     - Use `yarn jest testFileName` to run tests
     - Use `yarn swc-node path/to/script.ts` to run scripts
   - Do not create bullets in the "Testing" section for any of these:
     - Individual tests within a test file
   - Use present tense for verbs
   - Write a title for the pull request

5. Output to temp.md in the root of the project
6. Add a line at the bottom of the output which says "Generated with help
   from `/loom-mr`, but edited"
7. Copy the content to clipboard: `LC_CTYPE=UTF-8 pbcopy < temp.md`
8. Output to the user:
   - Verbatim: "Need to make edits? Consider prompting with follow-up
     instructions on style, content, spelling, etc."
   - Based on the contents of the transcript, suggest docs, PRs, Slack threads,
     links to tools that would be helpful: e.g., "This response might be better
     with the below links as context:\n- XXX\n- YYY"
   - If links are provided, add them inline in Markdown format:
     `[Link text](https://example.com)`
