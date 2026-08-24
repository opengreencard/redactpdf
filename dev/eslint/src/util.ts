import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/redactpdf-ai/redaction/blob/main/dev/eslint/docs/rules/${name}.md`
);
