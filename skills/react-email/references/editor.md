# Editor (`@react-email/editor`)

Embeddable TipTap/ProseMirror editor that serializes to email-ready HTML. Separate from the `react-email` template package.

Requires React 18+ and a bundler that supports package exports (Vite, Next.js, Webpack 5, etc.).

## Install

```sh
bun add @react-email/editor
```

```tsx
import '@react-email/editor/themes/default.css';
// or granular:
// import '@react-email/editor/styles/bubble-menu.css';
// import '@react-email/editor/styles/slash-command.css';
// import '@react-email/editor/styles/inspector.css';
```

## Entry Points

| Import | Purpose |
| --- | --- |
| `@react-email/editor` | Batteries-included `EmailEditor` |
| `@react-email/editor/core` | `composeReactEmail`, `EmailNode`, `EmailMark` |
| `@react-email/editor/extensions` | `StarterKit` + email extensions |
| `@react-email/editor/ui` | Bubble menus, slash commands, Inspector |
| `@react-email/editor/plugins` | `EmailTheming` |
| `@react-email/editor/utils` | Attribute/style helpers |

## Quick Start (`EmailEditor`)

```tsx
import { EmailEditor, type EmailEditorRef } from '@react-email/editor';
import '@react-email/editor/themes/default.css';
import { useRef } from 'react';

export function MyEditor() {
  const ref = useRef<EmailEditorRef>(null);

  return (
    <>
      <EmailEditor
        ref={ref}
        content="<p>Start typing...</p>"
        theme="basic"
        onReady={(editor) => console.log('ready', editor)}
        onChange={() => {}}
      />
      <button
        type="button"
        onClick={async () => {
          const { html, text } = await ref.current!.export();
          console.log(html, text);
        }}
      >
        Export
      </button>
    </>
  );
}
```

### Useful props / ref

- Props: `content`, `theme` (`'basic' | 'minimal'`), `editable`, `placeholder`, `onUploadImage`, `extensions`, `bubbleMenu`
- Ref: `export()` → `{ html, text }`, `getJSON()`, `getHTML()`, `editor`

## Minimal Extensions Setup

```tsx
import { StarterKit } from '@react-email/editor/extensions';
import { EditorProvider } from '@tiptap/react';

<EditorProvider extensions={[StarterKit]} content={content} />
```

Add UI as children: `BubbleMenu`, `SlashCommand`, and (with `EmailTheming`) `Inspector`.

## Theming and Export

```tsx
import { EmailTheming } from '@react-email/editor/plugins';
import { composeReactEmail } from '@react-email/editor/core';

const extensions = [StarterKit, EmailTheming.configure({ theme: 'basic' })];

const { html, text } = await composeReactEmail({
  editor,
  preview: 'Optional inbox preview',
});
```

Themes resolve to inlined styles during export. `'minimal'` is a near-blank slate for custom themes.

## Custom Nodes

Extend `EmailNode` / `EmailMark` from `@react-email/editor/core` and implement `renderToReactEmail` so export stays email-safe. Prefer table-friendly markup over flex/grid in custom renderers.

## When to Use Templates vs Editor

| Need | Approach |
| --- | --- |
| App-owned transactional mail | React templates + `render` |
| End users compose branded emails in-product | `@react-email/editor` |
| Designers iterate on copy/layout in repo | `email dev` + `.tsx` templates |
