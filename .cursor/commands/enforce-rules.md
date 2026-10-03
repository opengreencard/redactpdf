# Enforce rules

Review the current branch and working tree against a base branch, usually
`origin/main`, and enforce the applicable code-style Cursor rules.

## Parameters

$1: The base branch. If one isn't supplied, default to `origin/main`.

## Steps

1. List changed files with `git diff --numstat` from the base branch to the
   current state. Include tracked working-tree changes and call out untracked
   files separately.
2. Run `ls .cursor/rules` to get the complete list of repository rules.
3. Group the rules into groups of 1–7 thematically similar rules that are
   effective to address in one shared pass.
4. For each group, launch a separate subagent. Pass the changed-file list and
   base branch. Each subagent should:
   - Read each rule in the group directly with the Read tool.
   - Review only files that could violate those rules, using
     `git diff <base> -- path` for current working-tree changes and
     `git diff <base>...HEAD -- path` for committed branch changes. Do not run
     an unfiltered diff of the whole branch.
   - For each untracked file in the changed-file list, read the full file and
     review it as a new addition.
   - If the changes follow the rules, return `No changes needed`.
   - Otherwise, make only the necessary edits. Other subagents may be editing
     the codebase at the same time, so re-read files before changing them.

## Verification and commit

After all rule-review passes:

1. Run checks only for files changed by the rule passes:
   - `yarn typecheck:files -- <changed files>`
   - `yarn eslint --fix <changed files>`
   - `yarn jest <touched test>` where applicable.
2. Stage and commit a fresh commit (never amend) using:
   - Stage only edits made by the rule passes. Do not include pre-existing
     changes. If rule-pass edits overlap existing changes and cannot be
     separated safely, stop without committing or pushing.

   ```
   Used /enforce-rules command

   Rules fixed:
   - rule-name.mdc
     Human description of the change
   ```

3. Push the current branch.
