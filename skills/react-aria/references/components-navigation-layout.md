# Navigation and layout: Tabs, Link, Breadcrumbs, Disclosure, Toolbar, Group, Separator, Meter, ProgressBar, focus utilities, routing

Contents:

- [Tabs](#tabs)
- [Link](#link)
- [Client-side routing](#client-side-routing)
- [Breadcrumbs](#breadcrumbs)
- [Disclosure and DisclosureGroup](#disclosure-and-disclosuregroup)
- [Toolbar](#toolbar)
- [Group](#group)
- [Separator](#separator)
- [Meter](#meter)
- [ProgressBar](#progressbar)
- [Pressable and Focusable](#pressable-and-focusable)
- [FocusRing](#focusring)
- [FocusScope](#focusscope)
- [VisuallyHidden](#visuallyhidden)
- [Docs and types differences](#docs-and-types-differences)

## Tabs

Switches between panels in place. Pick it over `Disclosure` when only one section shows, and over a link list when panels live on the same page.

```tsx
import {Tabs, TabList, Tab, TabPanels, TabPanel, SelectionIndicator} from 'react-aria-components/Tabs';

<Tabs defaultSelectedKey="files">
  <TabList aria-label="Project">
    <Tab id="home">Home<SelectionIndicator /></Tab>
    <Tab id="files">Files<SelectionIndicator /></Tab>
    <Tab id="search" isDisabled>Search<SelectionIndicator /></Tab>
  </TabList>
  <TabPanels>
    <TabPanel id="home">Home content</TabPanel>
    <TabPanel id="files">Files content</TabPanel>
    <TabPanel id="search">Search content</TabPanel>
  </TabPanels>
</Tabs>;
```

`Tab` `id` must match `TabPanel` `id`. `TabList` needs `aria-label` or `aria-labelledby`.

Dynamic collections pass `items` and a render function to both lists. Use `dependencies` when the render function reads outside values.

```tsx
<Tabs>
  <TabList aria-label="Documents" items={tabs}>
    {item => <Tab>{item.title}</Tab>}
  </TabList>
  <TabPanels items={tabs}>
    {item => <TabPanel>{item.content}</TabPanel>}
  </TabPanels>
</Tabs>;
```

Props:

- `Tabs`
  - Selection: `selectedKey?: Key`, `defaultSelectedKey?: Key`, `onSelectionChange?: (key: Key) => void`, `disabledKeys?: Iterable<Key>`, `isDisabled?: boolean`
  - `orientation?: 'horizontal' | 'vertical'` (default `'horizontal'`)
  - `keyboardActivation?: 'automatic' | 'manual'` (default `'automatic'`). Use `manual` when a panel is slow to load: arrows move focus, Enter or Space selects.
- `TabList`: `items`, `dependencies`, `children`, `aria-label`
- `Tab`: `id`, `isDisabled`, press and hover events, link props (`href`, `target`, `rel`, `download`, `routerOptions`), `render`
- `TabPanels`: `items`, `dependencies`, `className` (plain string)
- `TabPanel`: `id`, `shouldForceMount?: boolean` (default `false`)

Styling:

| Part | Class | Data attributes | Render props |
| ---- | ----- | --------------- | ------------ |
| `Tabs` | `react-aria-Tabs` | `data-orientation` | `orientation` |
| `TabList` | `react-aria-TabList` | `data-orientation` | `orientation`, `state` |
| `Tab` | `react-aria-Tab` | `data-selected`, `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled` | same as booleans |
| `TabPanels` | `react-aria-TabPanels` | none | none |
| `TabPanel` | `react-aria-TabPanel` | `data-focused`, `data-focus-visible`, `data-inert`, `data-entering`, `data-exiting` | same, plus `state` |
| `SelectionIndicator` | `react-aria-SelectionIndicator` | `data-entering`, `data-exiting` | `isEntering`, `isExiting` |

### Animated selection indicator

Put a `SelectionIndicator` inside each `Tab`. Only the selected tab shows it. React Aria moves it between tabs with `translate`, so you only set position and a transition. The `Tab` needs `position: relative`.

```css
.react-aria-Tab {
  position: relative;
}

.react-aria-SelectionIndicator {
  position: absolute;
  transition-duration: 200ms;
}

.react-aria-TabList[data-orientation='horizontal'] .react-aria-SelectionIndicator {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  transition-property: translate, width;
}

.react-aria-TabList[data-orientation='vertical'] .react-aria-SelectionIndicator {
  top: 0;
  right: 0;
  height: 100%;
  width: 3px;
  transition-property: translate, height;
}
```

Wrapping `Tab` in your own component? Use `composeRenderProps` so user children stay functions:

```tsx
import {Tab as AriaTab, SelectionIndicator, type TabProps} from 'react-aria-components/Tabs';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';

function Tab(props: TabProps) {
  return (
    <AriaTab {...props}>
      {composeRenderProps(props.children, children => (
        <>
          {children}
          <SelectionIndicator />
        </>
      ))}
    </AriaTab>
  );
}
```

### Animated panels

`TabPanels` sets `--tab-panel-width` and `--tab-panel-height` during a change. It measures the new size, sets the old size, then sets the new one, and returns to `auto` when animations end. This runs only when the computed `transition` on `TabPanels` lists a size property. The exiting panel needs `position: absolute` so it does not push layout.

```css
.react-aria-TabPanels {
  position: relative;
  height: var(--tab-panel-height);
  width: var(--tab-panel-width);
  transition: height 400ms;
  overflow: clip;
}

.react-aria-TabPanel {
  box-sizing: border-box;
  transition: opacity 400ms;

  &[data-entering],
  &[data-exiting] {
    opacity: 0;
  }

  &[data-exiting] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
}
```

### Swipeable tabs

Render every panel with `shouldForceMount` in a horizontal scroll container, and use CSS scroll snap. Inactive panels are inert, so scrolling shows them but focus stays out. See `example-recipes.md` for the recipe.

With `shouldForceMount`, style `[data-inert]` so users can tell it is not active.

### Tab links

A `Tab` with `href` renders `<a>`. Use `render` for a router link, and keep the fallback for tabs without `href`:

```tsx
<Tab
  id="/home"
  href="/home"
  render={domProps => ('href' in domProps ? <RouterLink {...domProps} /> : <div {...domProps} />)}>
  Home
</Tab>;
```

Common pattern: drive `selectedKey` from the current path, with each `Tab` `id` set to its path. This is plain use of `selectedKey`, not a separate API.

Gotchas:

- `Tab` cannot hold an interactive child. Place action buttons next to `TabList`.
- Controlled `selectedKey` with a `Key` type: `useState<Key>('files')`, import `type {Key}` from `react-aria-components/Tabs`.
- `Tabs` keeps panel state only with `shouldForceMount`. Otherwise an unselected panel unmounts.

Docs: `https://react-aria.adobe.com/Tabs`

## Link

A navigation element with press, hover, and focus states. Use `Button` for actions. It renders `<a>` with `href`, and `<span role="link">` without.

```tsx
import {Link} from 'react-aria-components/Link';

<Link href="https://adobe.com" target="_blank" rel="noreferrer">Adobe</Link>;
<Link onPress={() => openPanel()}>Open panel</Link>;
```

Props:

- Link: `href`, `target`, `rel`, `download`, `hrefLang`, `ping`, `referrerPolicy`, `routerOptions`
- State: `isDisabled`, `autoFocus`, `aria-current`
- Events: `onPress`, `onPressStart`, `onPressEnd`, `onPressChange`, `onPressUp`, `onHoverStart`, `onHoverEnd`, `onHoverChange`, `onFocus`, `onBlur`, `onFocusChange`, `onKeyDown`, `onKeyUp`
- `render`: replaces the element. See routing below.

Styling:

- Class: `react-aria-Link`
- Data: `data-current` (from `aria-current`), `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled`
- Render props: `isCurrent`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`

Gotcha: a `Link` without `href` is still announced as a link. Keep it for navigation-like actions.

Docs: `https://react-aria.adobe.com/Link`

## Client-side routing

Two ways. `render` is what the Link page shows. `RouterProvider` applies to all link-capable items at once, including items that have no router component of their own.

### The render prop (per link)

The router link handles prefetch and full reload avoidance. Rules: render the expected element type, only one root element, and pass all props and the ref through.

```tsx
// no-check: next and react-router are not installed here.
import {Link} from 'react-aria-components/Link';
import NextLink from 'next/link';
import {Link as RouterLink} from 'react-router';

// Next.js
<Link href="/about" render={props => <NextLink {...props} />}>About</Link>;

// React Router
<Link href="/about" render={props => <RouterLink {...props} to={props.href} />}>About</Link>;
```

### RouterProvider (whole tree)

Every React Aria link-capable item below it (`Link`, `Tab`, `ListBoxItem`, `MenuItem`, `GridListItem`, `Row`, `TreeItem`, `Tag`) then calls `navigate` for its `href`. Modified clicks and non-self targets still go to the browser. `RouterProvider` is exported only from the package root.

```tsx
import {RouterProvider, Link} from 'react-aria-components';

function App({navigate, useHref, children}) {
  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      {children}
      <Link href="/about" routerOptions={{replace: true}}>About</Link>
    </RouterProvider>
  );
}

// Types for routerOptions and href come from module augmentation.
declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: {replace?: boolean};
  }
}
```

- `navigate: (path: Href, routerOptions: RouterOptions | undefined) => void`
- `useHref?: (href: Href) => string`, a hook that turns a router path into a real `href`, for routers with a base path
- `routerOptions` on a link passes through to `navigate`. Without the augmentation, its type is `never`, so passing it fails type checks.
- `RouterConfig` also takes `href` for type-safe paths.

Docs: `https://react-aria.adobe.com/frameworks`

## Breadcrumbs

An ordered list of links to the current page. The last item is the current page.

```tsx
import {Breadcrumbs, Breadcrumb, Link} from 'react-aria-components/Breadcrumbs';

<nav aria-label="Breadcrumbs">
  <Breadcrumbs>
    <Breadcrumb><Link href="/">Home</Link></Breadcrumb>
    <Breadcrumb><Link href="/docs">Docs</Link></Breadcrumb>
    <Breadcrumb><Link>Breadcrumbs</Link></Breadcrumb>
  </Breadcrumbs>
</nav>;
```

Dynamic, with an action. `onAction` gets the `id` of the pressed crumb:

```tsx
<Breadcrumbs items={crumbs} onAction={id => setCrumbs(crumbs.slice(0, crumbs.findIndex(c => c.id === id) + 1))}>
  {item => (
    <Breadcrumb>
      {({isCurrent}) => (
        <>
          <Link>{item.label}</Link>
          {!isCurrent && <ChevronIcon />}
        </>
      )}
    </Breadcrumb>
  )}
</Breadcrumbs>;
```

Props:

- `Breadcrumbs`: `items`, `dependencies`, `children`, `isDisabled`, `onAction?: (key: Key) => void`, `className` (plain string)
- `Breadcrumb`: `id?: Key`, `children` (nodes or a render function), `className`

Styling:

- Classes: `react-aria-Breadcrumbs` (`ol`), `react-aria-Breadcrumb` (`li`), `react-aria-Link`
- `Breadcrumb` data: `data-current`, `data-disabled`. Render props: `isCurrent`, `isDisabled`.
- `Link` inside: `data-current`, `data-disabled` on the last one

Behavior:

- The last crumb gets `aria-current="page"`, and its `Link` is disabled for you.
- Add separators yourself, from `isCurrent` or with CSS. Hide them from screen readers: use an icon with `aria-hidden` or a pseudo-element.
- For main page navigation, wrap in `<nav aria-label="...">` for a landmark.

Docs: `https://react-aria.adobe.com/Breadcrumbs`

## Disclosure and DisclosureGroup

Collapsible sections. A `DisclosureGroup` makes an accordion.

```tsx
import {Disclosure, DisclosurePanel, Heading, Button} from 'react-aria-components/Disclosure';

<Disclosure defaultExpanded>
  <Heading>
    <Button slot="trigger">System requirements</Button>
  </Heading>
  <DisclosurePanel>
    <div>Details</div>
  </DisclosurePanel>
</Disclosure>;
```

`Button` must have `slot="trigger"`. `Heading` and the trigger `Button` must not hold interactive children. To add an action beside the title, wrap in a `div`:

```tsx
<Disclosure>
  <div style={{display: 'flex', alignItems: 'center'}}>
    <Heading style={{flex: 1}}>
      <Button slot="trigger">Files</Button>
    </Heading>
    <Button aria-label="Settings"><SettingsIcon /></Button>
  </div>
  <DisclosurePanel>Files content</DisclosurePanel>
</Disclosure>;
```

Accordion:

```tsx
import {useState} from 'react';
import {DisclosureGroup, Disclosure, DisclosurePanel, Heading, Button, type Key} from 'react-aria-components/DisclosureGroup';

function Example() {
  let [expandedKeys, setExpandedKeys] = useState(new Set<Key>(['system']));
  return (
    <DisclosureGroup expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys} allowsMultipleExpanded>
      <Disclosure id="system">
        <Heading><Button slot="trigger">System</Button></Heading>
        <DisclosurePanel>System content</DisclosurePanel>
      </Disclosure>
      <Disclosure id="personal">
        <Heading><Button slot="trigger">Personal</Button></Heading>
        <DisclosurePanel>Personal content</DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  );
}
```

Props:

- `Disclosure`: `isExpanded`, `defaultExpanded`, `onExpandedChange?: (isExpanded: boolean) => void`, `isDisabled`, `id?: Key` (matches group keys)
- `DisclosurePanel`: `role?: 'group' | 'region'` (default `'group'`), `children` (required, a plain node), `aria-label`. Use `region` for important content.
- `DisclosureGroup`: `expandedKeys`, `defaultExpandedKeys` (`Iterable<Key>`), `onExpandedChange?: (keys: Set<Key>) => any`, `allowsMultipleExpanded?: boolean`, `isDisabled`. By default, at most one item is open.

Styling:

- Classes: `react-aria-DisclosureGroup`, `react-aria-Disclosure`, `react-aria-DisclosurePanel`
- `Disclosure` data: `data-expanded`, `data-disabled`, `data-focus-visible-within`. Render props: `isExpanded`, `isDisabled`, `isFocusVisibleWithin`, `state`.
- `DisclosurePanel` data: `data-focus-visible-within`
- `DisclosureGroup` data: `data-disabled`. Render props: `isDisabled`, `state`.

Height animation with `--disclosure-panel-height` (also `--disclosure-panel-width`, set during open and close). Move padding to an inner `div` so it clips cleanly:

```css
.react-aria-DisclosurePanel {
  height: var(--disclosure-panel-height);
  transition: height 250ms;
  overflow: clip;

  > div {
    padding: 8px 16px;
  }
}

.react-aria-Disclosure svg {
  transition: rotate 200ms;
}

.react-aria-Disclosure[data-expanded] svg {
  rotate: 90deg;
}
```

Behavior: the collapsed panel uses `hidden="until-found"` where supported, so browser find-in-page opens it.

Docs: `https://react-aria.adobe.com/Disclosure`, `https://react-aria.adobe.com/DisclosureGroup`

## Toolbar

One Tab stop for a set of controls, with arrow keys inside. Holds `Button`, `ToggleButtonGroup`, `Select`, `Group`, `Separator`.

```tsx
import {Toolbar, ToolbarContext} from 'react-aria-components/Toolbar';
import {Group} from 'react-aria-components/Group';
import {Button} from 'react-aria-components/Button';
import {Separator, SeparatorContext} from 'react-aria-components/Separator';
import {ToggleButton} from 'react-aria-components/ToggleButton';
import {ToggleButtonGroup, ToggleButtonGroupContext} from 'react-aria-components/ToggleButtonGroup';

function Example({orientation = 'horizontal' as const}) {
  return (
    <ToggleButtonGroupContext.Provider value={{orientation}}>
      <SeparatorContext.Provider value={{orientation: orientation === 'horizontal' ? 'vertical' : 'horizontal'}}>
        <Toolbar aria-label="Text formatting" orientation={orientation}>
          <ToggleButtonGroup aria-label="Style">
            <ToggleButton id="bold" aria-label="Bold"><BoldIcon /></ToggleButton>
            <ToggleButton id="italic" aria-label="Italic"><ItalicIcon /></ToggleButton>
          </ToggleButtonGroup>
          <Separator />
          <Group aria-label="Clipboard">
            <Button aria-label="Copy"><CopyIcon /></Button>
            <Button aria-label="Paste"><PasteIcon /></Button>
          </Group>
        </Toolbar>
      </SeparatorContext.Provider>
    </ToggleButtonGroupContext.Provider>
  );
}
```

Toolbar does not set the orientation of children. The docs' wrapper uses the two providers above: a `Separator` must run opposite to the toolbar, and a `ToggleButtonGroup` runs with it.

Props: `orientation?: 'horizontal' | 'vertical'` (default `'horizontal'`), `aria-label`, `aria-labelledby`.

Styling: class `react-aria-Toolbar`, data `data-orientation`, render prop `orientation`. A common choice: `.react-aria-Group { display: contents; }` inside the toolbar.

Gotcha: every icon-only child needs `aria-label`. Label inner groups so a screen reader hears a group name.

Docs: `https://react-aria.adobe.com/Toolbar`

## Group

A semantic grouping with hover and focus state for styling. Use it for a compound input frame, or to group controls in a toolbar. It adds no keyboard behavior.

```tsx
import {Group} from 'react-aria-components/Group';
import {Input} from 'react-aria-components/Input';

<Group aria-label="Serial number">
  <Input aria-label="First 3 digits" maxLength={3} placeholder="000" />
  <Input aria-label="Last 4 digits" maxLength={4} placeholder="0000" />
</Group>;
```

Props:

- `isDisabled`, `isInvalid`, `isReadOnly`
- `role?: 'group' | 'region' | 'presentation'` (default `'group'`). `region` for content that belongs in the page outline. `presentation` for a visual-only group.
- `onHoverStart`, `onHoverEnd`, `onHoverChange`
- `aria-label`, `aria-labelledby`

Styling: class `react-aria-Group`. Data: `data-hovered`, `data-focus-within`, `data-focus-visible`, `data-disabled`, `data-invalid`. Render props: the matching booleans.

Docs: `https://react-aria.adobe.com/Group`

## Separator

A divider between groups, for example in `Menu`, `ListBox`, and `Toolbar`.

```tsx
import {Separator} from 'react-aria-components/Separator';

<Separator />;
<Separator orientation="vertical" />;
```

Props: `orientation?: 'horizontal' | 'vertical'` (default `'horizontal'`), `elementType?: string`.

It renders `hr`, or `div` when vertical. A `div` gets `role="separator"`.

Styling: class `react-aria-Separator`. It has no `data-*` state, so select vertical with `[aria-orientation='vertical']`:

```css
.react-aria-Separator {
  border-style: none;
  height: 2px;
  width: 100%;

  &[aria-orientation='vertical'] {
    width: 2px;
    min-height: 32px;
    height: 100%;
  }
}
```

Docs: `https://react-aria.adobe.com/Separator`

## Meter

A quantity in a known range: disk use, score. Use `ProgressBar` for an operation over time.

```tsx
import {Meter, Label} from 'react-aria-components/Meter';

<Meter value={75} minValue={0} maxValue={100}>
  {({percentage, valueText}) => (
    <>
      <Label>Storage used</Label>
      <span className="value">{valueText}</span>
      <div className="track">
        <div className="fill" style={{width: percentage + '%'}} />
      </div>
    </>
  )}
</Meter>;
```

Props: `value` (default `0`), `minValue` (default `0`), `maxValue` (default `100`), `valueLabel?: ReactNode` (for example "1 of 4"), `formatOptions?: Intl.NumberFormatOptions` (default `{style: 'percent'}`).

Styling: class `react-aria-Meter`. Render props: `percentage: number`, `valueText: string | undefined`. Build the track and fill yourself. Label it with `Label`, `aria-label`, or `aria-labelledby`.

Docs: `https://react-aria.adobe.com/Meter`

## ProgressBar

Progress of an operation, with a known value or indeterminate. Use it for the bar and the circle.

```tsx
import {ProgressBar} from 'react-aria-components/ProgressBar';
import {Label} from 'react-aria-components/Label';

<ProgressBar value={30}>
  {({percentage, valueText, isIndeterminate}) => (
    <>
      <Label>Uploading</Label>
      <span className="value">{valueText}</span>
      <div className="track">
        <div className="fill" style={{width: (isIndeterminate ? 100 : percentage) + '%'}} />
      </div>
    </>
  )}
</ProgressBar>;
```

Circle: SVG inside a `ProgressBar`, with `aria-label` when no `Label` shows.

```tsx
<ProgressBar aria-label="Loading" value={30}>
  {({percentage}) => (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" strokeWidth={4}>
      <circle cx={16} cy={16} r={14} stroke="currentColor" opacity={0.2} />
      <circle
        cx={16}
        cy={16}
        r={14}
        stroke="currentColor"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - (percentage ?? 25)}
        transform="rotate(-90 16 16)"
      />
    </svg>
  )}
</ProgressBar>;
```

Props: all of `Meter`'s, plus `isIndeterminate?: boolean`.

Styling: class `react-aria-ProgressBar`. Render props: `percentage: number | undefined` (undefined when indeterminate), `valueText`, `isIndeterminate`. Select the indeterminate state with `:not([aria-valuenow])`.

Docs: `https://react-aria.adobe.com/ProgressBar`

## Pressable and Focusable

Wrappers that give press or focus behavior to a child you own. They exist for custom overlay triggers and third party elements. For overlay use, see the overlays reference.

```tsx
import {Pressable} from 'react-aria/Pressable';
import {Focusable} from 'react-aria/Focusable';

<Pressable onPress={() => run()}>
  <span role="button">Run</span>
</Pressable>;

<Focusable>
  <span role="link">Details</span>
</Focusable>;
```

- `Pressable` props: `onPress`, `onPressStart`, `onPressEnd`, `onPressChange`, `onPressUp`, `isPressed`, `isDisabled`, `preventFocusOnPress`, `shouldCancelOnPointerExit`, `allowTextSelectionOnPress`. Single element child.
- `Focusable` props: `isDisabled`, `autoFocus`, `onFocus`, `onBlur`, `onFocusChange`, `onKeyDown`, `onKeyUp`, `excludeFromTabOrder`. Single element child.
- Also exported from `react-aria-components`: `Pressable` from `/Modal`, `/Popover`, and `/Pressable`, and `Focusable` from `/Tooltip` and `/Focusable`.
- Child must have an interactive role or semantic element. A component child must forward `ref` and spread props to a DOM element.

## FocusRing

A class on keyboard focus only. Prefer `data-focus-visible` on React Aria components. Use this for plain elements.

```tsx
import {FocusRing} from 'react-aria/FocusRing';

<FocusRing focusRingClass="focus-ring">
  <button className="button">Test</button>
</FocusRing>;
```

Props: `focusRingClass`, `focusClass`, `within?: boolean` (default `false`), `isTextInput`, `autoFocus`. One element child. The hook form is `useFocusRing` (`react-aria/useFocusRing`).

When the input type is unknown (for example, when the user switches back from another tab), the ring shows.

Docs: `https://react-aria.adobe.com/FocusRing`

## FocusScope

Contains, restores, and moves focus for custom overlays and composite widgets. React Aria overlays already do this: use it only with custom elements.

```tsx
import {FocusScope, useFocusManager} from 'react-aria/FocusScope';

<FocusScope contain restoreFocus autoFocus>
  <input aria-label="First" />
  <button onClick={close}>Close</button>
</FocusScope>;

function ToolbarButton({children}) {
  let focusManager = useFocusManager();
  return (
    <button
      onKeyDown={e => {
        if (e.key === 'ArrowRight') focusManager?.focusNext({wrap: true});
        if (e.key === 'ArrowLeft') focusManager?.focusPrevious({wrap: true});
      }}>
      {children}
    </button>
  );
}
```

Props: `contain`, `restoreFocus`, `autoFocus`, `children`.

`useFocusManager(): FocusManager | undefined` must be called inside the scope. Methods: `focusNext`, `focusPrevious`, `focusFirst`, `focusLast`, each taking `{from?: Element, tabbable?: boolean, wrap?: boolean, accept?: (node: Element) => boolean}` and returning the focused element or `null`.

Docs: `https://react-aria.adobe.com/FocusScope`

## VisuallyHidden

Hides content on screen and keeps it for screen readers.

```tsx
import {VisuallyHidden, useVisuallyHidden} from 'react-aria/VisuallyHidden';

<VisuallyHidden>Search results</VisuallyHidden>;
<VisuallyHidden isFocusable>
  <a href="#main">Skip to content</a>
</VisuallyHidden>;
```

Props: `elementType` (default `'div'`), `isFocusable?: boolean` (the content shows when focused: skip links), `children`.

`useVisuallyHidden` returns props to spread on your element, for example to hide a native input.

It is absolutely positioned, so it needs a `position: relative` or `absolute` ancestor. Without one, stray scrollbars can appear.

Docs: `https://react-aria.adobe.com/VisuallyHidden`

## Docs and types differences

- `FocusRing` and `FocusScope` docs import from `@react-aria/focus`. In this version, use `react-aria/FocusRing` and `react-aria/FocusScope`.
- `frameworks.md` says "render a `RouterProvider`" for React Router, but its code sample has none, and the `Link` page shows only `render`. `RouterProvider` is exported only from the `react-aria-components` and `react-aria` roots, so it has no subpath.
- The docs tables show `routerOptions` as `undefined`. The real type is `RouterOptions`, from `RouterConfig` augmentation in `@react-types/shared`. Without augmentation, it resolves to `never`.
- The docs' `DisclosureHeader` and `InputGroup` are starter wrappers, not exports. Use `Heading` with `Button slot="trigger"`, and `Group`.
- The docs table for `DisclosurePanel` lists `label` and `labelElementType`. They come through inherited types, and the docs do not use them. Skip them.
