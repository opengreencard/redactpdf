---
name: storybook-preview
description: Preview changed front-end components in Storybook by checking if Storybook is running and opening the correct story URL.
---

# Storybook Preview

Use this when you want to quickly preview a front-end component change in Storybook.

## Quick Start

1. Check if Storybook is already running:

```bash
curl -sf http://localhost:6006 >/dev/null
```

2. If the check fails, start Storybook:

```bash
yarn storybook
```

3. Open the story URL once Storybook is running:

```text
http://localhost:6006/iframe.html?id=<story-id>&viewMode=story
```

`<story-id>` is usually `<componentnameinlowercase>--<storyname>`, where spaces are replaced with hyphens.

Example:

```text
landingpageinner--logged-in
```

This is for `LandingPageInner.stories.tsx` and the story `LoggedIn`.
