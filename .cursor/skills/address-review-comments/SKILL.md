---
name: address-review-comments
description: Download and address unresolved pull request review comments one by one.
disable-model-invocation: true
triggers:
  - user
---

# Address pull request review comments

Can you help address review comments for a pull request?

1. Run this command directly to download all pull request review comments,
   extract the data, and get file contents. DO NOT use MCP tools for this.

   ```sh
   bash .cursor/libs/download-pull-request-comments.sh ${owner}/${repo} ${pullRequestNumber}
   ```

   - e.g., for https://github.com/opengreencard/redactpdf/pull/42
     - repository: opengreencard/redactpdf
     - pull_request_number: 42

   This script will automatically:

   - Download all pull request review threads with pagination (via `gh` CLI)
   - Extract and display comments
   - Extract and display discussion thread IDs
   - Run `git show` commands for all file contents mentioned in comments

   Note: The script will print out any sub-commands it runs (e.g., jq, git show).

   IMPORTANT: Read the entire command output. Do not buffer or skip parts to save
   tokens - you need all the comments, file contents, and discussion thread IDs.

2. For each discussion thread ID, create a TODO titled "Maybe create 3 TODOs for
   discussion_thread_id <id>". Don't go straight to executing the TODOs.
   Instead, create them first.

3. Then, go through each of the TODOs:

   If the discussion thread's comments are:

   1. A real suggestion (vs. just a "Thanks for cleaning this up!") AND
   2. NOT solely a CodeRabbit Nitpick comment AND
   3. NOT resolved

   Add 3 TODOs, each including the comment ID and a short summary of the fix.

   - Address X comment and run linter and tests
   - Commit X comment's fix to Git
   - Push X comment's commit, then reply with a link to it

   IMPORTANT: you'll have lots of TODOs, but that's fine.

4. Then, execute the TODOs to address/commit/push/reply:

   - Address X comment

     1. Fix the issue mentioned in the comment (ignoring any CodeRabbit nitpicks)
        1. If the author of the pull request has also commented about how
           they'd like to fix the comment, follow their instructions
     2. Run `yarn eslint --fix <file>` on any changed TypeScript (.ts/.tsx) files
     3. If you changed any test files or code affecting any test files, actually
        run them to make sure they still work.

   - Commit X comment's fix to Git

     4. Commit the fix with a commit message of

        ```
        Address review comment: <summary of review comment>

        https://github.com/opengreencard/redactpdf/pull/<PR_NUMBER>#discussion_r<COMMENT_ID>

        Original comment:
        <Full text of original review comment here>
        ```

        Example:

        ```
        Address review comment: use cache-busting timestamp in image source
        https://github.com/opengreencard/redactpdf/pull/42#discussion_r1234567890

        Original comment:
        Could we just include this directly in the imageSource? It will still
        have the same behavior of only changing on mount (or when src changes).
        ```

   - Push X comment's commit, then reply with a link to it

     5. Figure out the full Git commit hash by running
        `git rev-parse HEAD`
     6. Run `git push` to push the commit to the remote **before** adding any
        reply. CodeRabbit cannot see unpushed commits, so a reply that
        mentions a local-only hash will get a "I can't see these changes"
        response.
     7. Add a reply to the review thread using `gh api graphql`:

        ```sh
        gh api graphql -f query='
          mutation($threadId: ID!, $body: String!) {
            addPullRequestReviewThreadReply(input: {
              pullRequestReviewThreadId: $threadId
              body: $body
            }) {
              comment { id databaseId }
            }
          }' -f threadId='<DISCUSSION_THREAD_ID>' -f body='Automatic attempt to address committed at https://github.com/opengreencard/redactpdf/pull/<PR_NUMBER>/commits/<GIT_COMMIT_HASH>: <description of the change>'
        ```

        IMPORTANT: use the full commit hash, not just the first few characters.
        Include a brief description of what was changed after the colon.

The pull request whose comments to address is:

ID or URL: $1

If you didn't get an ID or URL above, immediately after this skill is invoked,
respond with:

```
I'm ready to help address pull request review comments. Please paste the URL
of the pull request: e.g.,

https://github.com/opengreencard/redactpdf/pull/42

Then, I'll read the pull request, add the TODOs, and execute on them.
```

It's OK to create a long TODO list. This is expected for larger pull requests.
Prefer being exhaustive over keeping a short list.

Your initial TODO list should be:

1. Run the script to download pull request comments, discussion IDs, and file contents
2. Create a TODO for each discussion ID

Keep going until your TODO list is complete.
