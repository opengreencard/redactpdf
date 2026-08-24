# Suggest ESLint rules, skills, cursor rules, and AGENTS.md updates based on feedback

Run this at the end of a long conversation where someone reviewed code and
suggested follow-ups. The "feedback" here is user feedback from that
conversation — read the conversation context before this command, especially
user messages and review comments.

Suggest improvements from that feedback in priority order:

1. **ESLint rules** (automated enforcement -- best)
2. **Skills**: either new ones, or changes to existing skills
3. **Existing commands** that were run as part of this conversation
4. **Cursor rules** (AI guidance -- good, especially for somewhat more
   ambiguous instructions that don't always apply)
5. **AGENTS.md updates** (documentation)

## ESLint Rule Types

- `no-restricted-syntax` in `.eslintrc.cjs` - For AST patterns (most common)
- `no-restricted-imports` - For blocking specific imports
- Custom rule - For complex logic requiring custom implementation

Don't implement it yet: ask for feedback before implementing
