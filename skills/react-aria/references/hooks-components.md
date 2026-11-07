# React Aria: pattern hooks with state

Hooks from `react-aria` 3.53.1 with state from `react-stately` 3.51.0. Doc: <https://react-aria.adobe.com/hooks>. Each hook page is `https://react-aria.adobe.com/<Component>/<hook>`, for example `/Select/useSelect`.

The docs' hook pages import a private starter kit (`hooks-starter/*`), which is not an npm package and has no public source here. The worked examples below are written from the `.d.ts` files and typecheck against the installed packages. They have not been run in a browser.

Contents:

- [When to use hooks](#when-to-use-hooks)
- [Rules for all hooks](#rules-for-all-hooks)
- [Combining hooks with components](#combining-hooks-with-components)
- [Shared parts: Button, Popover, ListBox, Dialog](#shared-parts)
- [Worked: Select](#worked-select)
- [Worked: ComboBox](#worked-combobox)
- [Worked: Menu](#worked-menu)
- [Worked: Table](#worked-table)
- [Worked: Tabs](#worked-tabs)
- [Worked: Slider](#worked-slider)
- [Worked: Calendar and RangeCalendar](#worked-calendar-and-rangecalendar)
- [Worked: DateField, DatePicker, DateRangePicker](#worked-datefield-datepicker-daterangepicker)
- [Hook table: all other patterns](#hook-table)
- [Short examples](#short-examples)
- [react-stately export inventory](#react-stately-export-inventory)

## When to use hooks

Start with React Aria Components. Use hooks only when you need one of these:

- Full control over the DOM structure.
- To add behavior to components you already have, or to a third-party library.
- More control than render props and contexts give.

Components are built on these same hooks, so you can move between the two. You do not have to pick one for a whole pattern. A hook can build the parent while components render the children.

## Rules for all hooks

1. **State first, then behavior.** `let state = useXState(props)` from `react-stately/useXState`, then `useX(props, state, ref)` from `react-aria/useX`. Pass the same `props` to both.
2. **Spread each returned prop group on its element.** `labelProps` on the label, and so on. A `descriptionProps` or `errorMessageProps` element renders only when it has content, and you must also pass `description` and `errorMessage` to the hook so the input gets `aria-describedby`.
3. **`AriaButtonProps` are not DOM props.** `triggerProps`, `buttonProps`, `clearButtonProps`, `closeButtonProps`, `removeButtonProps`, `prevButtonProps`, `nextButtonProps`, `incrementButtonProps`, `decrementButtonProps`, `expandButtonProps`, and `menuTriggerProps` contain `onPress`. Pass them through `useButton` first. If you spread them on `<button>`, the button does nothing and React warns.
4. **Option props are not DOM props either.** `menuProps`, `listBoxProps`, `fieldProps` (from pickers), `calendarProps`, and `dialogProps` go into the next hook.
5. **Refs are object refs.** Use `useRef`. For a forwarded ref, use `useObjectRef`.
6. **Combine prop groups with `mergeProps`.** Never spread two groups that can share a key.
7. **Provide a label.** Pass `label` and render `labelProps`, or pass `aria-label` or `aria-labelledby`. Without one you get a console warning.
8. **Locale.** Some state hooks need it: `let {locale} = useLocale()` from `react-aria/I18nProvider`.
9. **Collections.** Static or dynamic children use `Item` and `Section` from `react-stately`. Read nodes from `state.collection`. Use `collection.getChildren(key)`: `node.childNodes` is deprecated.

```tsx
import {Item} from 'react-stately/Item';
import {Section} from 'react-stately/Section';
import {useListState} from 'react-stately/useListState';

function Example({rows}: {rows: {id: string; name: string}[]}) {
  // Dynamic: items plus a render function. `id` or `key` on the object sets the key.
  let dynamic = useListState({items: rows, children: row => <Item>{row.name}</Item>});
  // Static: a key on each element.
  let fixed = useListState({
    children: (
      <Section title="Fruit">
        <Item key="apple">Apple</Item>
      </Section>
    )
  });
  return <>{dynamic.collection.size + fixed.collection.size}</>;
}
```

`Item` props: `children`, `title` (rendered content when `children` is child items or panel content), `textValue` (required when `children` is not plain text, for type-to-select), `aria-label`, `childItems`, `hasChildItems`, plus link props (`href`, `target`, `rel`, and others). `Section` props: `title`, `aria-label`, `children`, `items`. Node fields: `key`, `type` (`'item'`, `'section'`), `value`, `rendered`, `textValue`, `props`, `level`, `index`, `parentKey`, `hasChildNodes`.

## Combining hooks with components

Doc: <https://react-aria.adobe.com/hooks#combining-hooks-with-react-aria-components>

### Consume a context: useContextProps

Replace one part of a component with your own hook-based version. `useContextProps(props, ref, Context)` merges local props and ref with the ones from context and handles `slot`.

```tsx
import {forwardRef, useRef} from 'react';
import {CheckboxContext, type CheckboxProps} from 'react-aria-components/Checkbox';
import {useContextProps} from 'react-aria-components/slots';
import {useCheckbox} from 'react-aria/useCheckbox';
import {useToggleState} from 'react-stately/useToggleState';

const MyCheckbox = forwardRef((props: CheckboxProps, ref: React.ForwardedRef<HTMLLabelElement>) => {
  let [mergedProps, mergedRef] = useContextProps(props, ref, CheckboxContext);
  let {children, ...ariaProps} = mergedProps;
  let inputRef = useRef<HTMLInputElement>(null);
  let state = useToggleState(ariaProps);
  let {labelProps, inputProps} = useCheckbox(ariaProps, state, inputRef);
  return (
    <label {...labelProps} ref={mergedRef}>
      <input {...inputProps} ref={inputRef} />
    </label>
  );
});
```

`MyCheckbox` can now replace `Checkbox` with `slot="selection"` in `Table` or `GridList`.

Docs and types disagree here. The docs example types the ref as `HTMLInputElement`, passes it to `useCheckbox`, and spreads the whole props object. In 1.22.1 `CheckboxContext` carries an `HTMLLabelElement` ref, and `CheckboxProps['children']` can be a render function, which `useCheckbox` does not accept. The version above follows the types. `CheckboxProps` also has its own `inputRef` prop if you need to expose the input.

### Provide context: Provider

Build the parent with a hook and reuse component children. Each child reads its own context.

```tsx
import {useRef} from 'react';
import {ButtonContext} from 'react-aria-components/Button';
import {GroupContext} from 'react-aria-components/Group';
import {InputContext} from 'react-aria-components/Input';
import {LabelContext} from 'react-aria-components/Label';
import type {NumberFieldProps} from 'react-aria-components/NumberField';
import {Provider} from 'react-aria-components/slots';
import {useLocale} from 'react-aria/I18nProvider';
import {useNumberField} from 'react-aria/useNumberField';
import {useNumberFieldState} from 'react-stately/useNumberFieldState';

function CustomNumberField(props: NumberFieldProps & {children: React.ReactNode}) {
  let {locale} = useLocale();
  let state = useNumberFieldState({...props, locale});
  let ref = useRef<HTMLInputElement>(null);
  let {labelProps, groupProps, inputProps, incrementButtonProps, decrementButtonProps} =
    useNumberField(props, state, ref);
  return (
    <Provider
      values={[
        [GroupContext, groupProps],
        [InputContext, {...inputProps, ref}],
        [LabelContext, labelProps],
        [ButtonContext, {slots: {increment: incrementButtonProps, decrement: decrementButtonProps}}]
      ]}>
      {props.children}
    </Provider>
  );
}
```

```tsx
import {Button} from 'react-aria-components/Button';
import {Group} from 'react-aria-components/Group';
import {Input} from 'react-aria-components/Input';
import {Label} from 'react-aria-components/Label';

<CustomNumberField>
  <Label>Width</Label>
  <Group>
    <Input />
    <Button slot="increment">+</Button>
    <Button slot="decrement">-</Button>
  </Group>
</CustomNumberField>;
```

Other helpers in `react-aria-components/slots`: `useSlottedContext(context, slot)` and `DEFAULT_SLOT`. `Provider` takes up to 13 pairs. Slots: `{slots: {name: props, [DEFAULT_SLOT]: props}}`. A child with a `slot` that is not in `slots` throws `Invalid slot`, and `slot={null}` opts out of the context.

### Hook parent with component children for a collection

`useSelect`, `useComboBox`, and `useDateRangePicker` work this way in the docs. For items built from components (`ListBoxItem`), build the collection with `CollectionBuilder` and pass it as `collection`. This matches how the `Select` component is implemented:

```tsx
import {useRef} from 'react';
import {Button, ButtonContext} from 'react-aria-components/Button';
import {Label, LabelContext} from 'react-aria-components/Label';
import {ListBox, ListBoxContext, ListStateContext} from 'react-aria-components/ListBox';
import {OverlayTriggerStateContext} from 'react-aria-components/Dialog';
import {Popover, PopoverContext} from 'react-aria-components/Popover';
import {Provider} from 'react-aria-components/slots';
import {CollectionBuilder} from 'react-aria/CollectionBuilder';
import {HiddenSelect, useSelect} from 'react-aria/useSelect';
import {useSelectState} from 'react-stately/useSelectState';

function HookSelect({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <CollectionBuilder content={children}>
      {collection => <Inner label={label} collection={collection} />}
    </CollectionBuilder>
  );
}

function Inner({label, collection}: {label: string; collection: any}) {
  let props = {label, collection, children: undefined};
  let state = useSelectState(props);
  let ref = useRef<HTMLButtonElement>(null);
  let {labelProps, triggerProps, valueProps, menuProps, hiddenSelectProps} = useSelect(props, state, ref);
  return (
    <Provider
      values={[
        [LabelContext, {...labelProps, elementType: 'span'}],
        [ButtonContext, {...triggerProps, ref, isPressed: state.isOpen}],
        [OverlayTriggerStateContext, state],
        [PopoverContext, {triggerRef: ref, placement: 'bottom start'}],
        [ListBoxContext, menuProps],
        [ListStateContext, state]
      ]}>
      <Label>{label}</Label>
      <HiddenSelect {...hiddenSelectProps} />
      <Button>
        <span {...valueProps}>{state.selectedItem?.rendered ?? 'Select'}</span>
      </Button>
      <Popover>
        <ListBox />
      </Popover>
    </Provider>
  );
}
```

`CollectionBuilder` comes from `react-aria/CollectionBuilder` and `react-aria-components/CollectionBuilder`. Those paths also export `createLeafComponent` and `createBranchComponent`, for custom collection item components.

### Render props: useRenderProps

Gives a custom component the same `className`, `style`, and `children` function API as built-in components. The docs import it from the package root. It also has a subpath:

```tsx
import {useRenderProps} from 'react-aria-components/useRenderProps';

function MyComponent(props: any) {
  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    children: props.children,
    defaultClassName: 'my-component',
    values: {isSelected: props.isSelected}
  });
  return <div {...renderProps} />;
}
```

Options: `values` (required), `className`, `style`, `children`, `defaultClassName`, `defaultStyle`, `defaultChildren`, `id`, `render`, and labeling props. It returns the resolved props to spread, including `data-rac`. For wrapping a render prop in your own style, use `composeRenderProps` from `react-aria-components/composeRenderProps`.

## Shared parts

The worked examples reuse these four parts. They use inline positioning only where the hook needs it. Add your own classes.

```tsx
import {useRef, type ReactNode, type RefObject} from 'react';
import {DismissButton, Overlay} from 'react-aria/Overlay';
import {useButton, type AriaButtonProps} from 'react-aria/useButton';
import {useDialog, type AriaDialogProps} from 'react-aria/useDialog';
import {useListBox, useListBoxSection, useOption, type AriaListBoxOptions} from 'react-aria/useListBox';
import {usePopover, type AriaPopoverProps} from 'react-aria/usePopover';
import type {Node} from 'react-stately';
import type {ListState} from 'react-stately/useListState';
import type {OverlayTriggerState} from 'react-stately/useOverlayTriggerState';

export function Button(props: AriaButtonProps & {buttonRef?: RefObject<HTMLButtonElement | null>}) {
  let localRef = useRef<HTMLButtonElement>(null);
  let ref = props.buttonRef ?? localRef;
  let {buttonProps} = useButton(props, ref);
  return <button {...buttonProps} ref={ref}>{props.children}</button>;
}

interface PopoverProps extends Omit<AriaPopoverProps, 'popoverRef'> {
  children: ReactNode;
  state: OverlayTriggerState;
  popoverRef?: RefObject<HTMLDivElement | null>;
}

export function Popover({children, state, offset = 8, ...props}: PopoverProps) {
  let localRef = useRef<HTMLDivElement>(null);
  let popoverRef = props.popoverRef ?? localRef;
  let {popoverProps, underlayProps} = usePopover({...props, offset, popoverRef}, state);
  return (
    <Overlay>
      {!props.isNonModal && <div {...underlayProps} style={{position: 'fixed', inset: 0}} />}
      <div {...popoverProps} ref={popoverRef}>
        {!props.isNonModal && <DismissButton onDismiss={state.close} />}
        {children}
        <DismissButton onDismiss={state.close} />
      </div>
    </Overlay>
  );
}

interface ListBoxProps<T> extends AriaListBoxOptions<T> {
  state: ListState<T>;
  listBoxRef?: RefObject<HTMLUListElement | null>;
}

export function ListBox<T>({state, listBoxRef, ...props}: ListBoxProps<T>) {
  let localRef = useRef<HTMLUListElement>(null);
  let ref = listBoxRef ?? localRef;
  let {listBoxProps, labelProps} = useListBox(props, state, ref);
  return (
    <>
      {props.label && <div {...labelProps}>{props.label}</div>}
      <ul {...listBoxProps} ref={ref}>
        {[...state.collection].map(node =>
          node.type === 'section'
            ? <ListBoxSection key={node.key} section={node} state={state} />
            : <Option key={node.key} item={node} state={state} />
        )}
      </ul>
    </>
  );
}

function ListBoxSection<T>({section, state}: {section: Node<T>; state: ListState<T>}) {
  let {itemProps, headingProps, groupProps} = useListBoxSection({
    heading: section.rendered,
    'aria-label': section['aria-label']
  });
  return (
    <li {...itemProps}>
      {section.rendered && <span {...headingProps}>{section.rendered}</span>}
      <ul {...groupProps}>
        {[...state.collection.getChildren(section.key)].map(node => (
          <Option key={node.key} item={node} state={state} />
        ))}
      </ul>
    </li>
  );
}

function Option<T>({item, state}: {item: Node<T>; state: ListState<T>}) {
  let ref = useRef<HTMLLIElement>(null);
  let {optionProps, isSelected, isFocused, isDisabled} = useOption({key: item.key}, state, ref);
  return (
    <li
      {...optionProps}
      ref={ref}
      data-selected={isSelected || undefined}
      data-focused={isFocused || undefined}
      data-disabled={isDisabled || undefined}>
      {item.rendered}
    </li>
  );
}

export function Dialog({title, children, ...props}: AriaDialogProps & {title?: ReactNode; children: ReactNode}) {
  let ref = useRef<HTMLDivElement>(null);
  let {dialogProps, titleProps} = useDialog(props, ref);
  return (
    <div {...dialogProps} ref={ref}>
      {title && <h3 {...titleProps}>{title}</h3>}
      {children}
    </div>
  );
}
```

Notes:

- `usePopover` handles position, outside press, Escape, scroll lock, and hiding the rest of the page from screen readers. Pair it with `useDialog` or a menu or listbox inside. Alone it is not accessible.
- `isNonModal` popovers (ComboBox) do not lock scroll or block the page. Do not render an underlay for them.
- Keep the two `DismissButton`s. They are how a screen reader user closes the overlay.
- Option states come from `useOption` (`isSelected`, `isFocused`, `isFocusVisible`, `isDisabled`, `isPressed`, `allowsSelection`, `hasAction`). Also `labelProps` and `descriptionProps` for two-line options.

## Worked: Select

State: `useSelectState` from `react-stately/useSelectState`. Hook: `useSelect`, `HiddenSelect`, `useHiddenSelect` from `react-aria/useSelect`. Doc: <https://react-aria.adobe.com/Select/useSelect>

```tsx
import {useRef} from 'react';
import {useButton} from 'react-aria/useButton';
import {HiddenSelect, useSelect, type AriaSelectOptions} from 'react-aria/useSelect';
import {Item} from 'react-stately/Item';
import {useSelectState, type SelectStateOptions} from 'react-stately/useSelectState';

type SelectProps<T> = AriaSelectOptions<T> & SelectStateOptions<T> & {label: string};

function Select<T extends object>(props: SelectProps<T>) {
  let state = useSelectState(props);
  let ref = useRef<HTMLButtonElement>(null);
  let {labelProps, triggerProps, valueProps, menuProps, descriptionProps, errorMessageProps, hiddenSelectProps} =
    useSelect(props, state, ref);
  let {buttonProps} = useButton(triggerProps, ref);
  return (
    <div>
      <div {...labelProps}>{props.label}</div>
      <HiddenSelect {...hiddenSelectProps} />
      <button {...buttonProps} ref={ref}>
        <span {...valueProps}>{state.selectedItem?.rendered ?? 'Select an option'}</span>
        <span aria-hidden="true">▼</span>
      </button>
      {props.description && <div {...descriptionProps}>{props.description as React.ReactNode}</div>}
      {state.displayValidation.isInvalid && (
        <div {...errorMessageProps}>{state.displayValidation.validationErrors.join(' ')}</div>
      )}
      {state.isOpen && (
        <Popover state={state} triggerRef={ref} placement="bottom start">
          <ListBox {...menuProps} state={state} />
        </Popover>
      )}
    </div>
  );
}

<Select label="Animal" name="animal" onChange={key => console.log(key)}>
  <Item key="cat">Cat</Item>
  <Item key="dog">Dog</Item>
</Select>;
```

| Returned | Goes on |
| --- | --- |
| `labelProps` | Label element. Use `div` or `span`, not `<label>`: the trigger is a button. |
| `triggerProps` | `useButton(triggerProps, ref)`, then `<button>` |
| `valueProps` | `span` with the selected text |
| `menuProps` | `useListBox` |
| `hiddenSelectProps` | `<HiddenSelect>` (includes `state` and `triggerRef`) |
| `descriptionProps`, `errorMessageProps` | Help text elements |
| `isInvalid`, `validationErrors`, `validationDetails` | Read for error display |

Props:

- Value: `value`, `defaultValue`, `onChange`. Mode: `selectionMode` (`'single'` default, or `'multiple'`). `value` is `Key | null` for single and `readonly Key[]` for multiple.
- Deprecated: `selectedKey`, `defaultSelectedKey`, `onSelectionChange`. Use the `value` trio. State reads: `value`, `setValue`, `selectedItem`, `selectedItems`, `selectedKey`, `setSelectedKey`.
- Open: `isOpen`, `defaultOpen`, `onOpenChange`. Also `shouldCloseOnSelect` (true for single, false otherwise), `allowsEmptyCollection`.
- Form: `name`, `form`, `autoComplete`, `isRequired`, `validate`, `validationBehavior` (`'aria'` default), `isInvalid`, `isDisabled`.
- Items: `items`, `children`, `disabledKeys`.

Gotchas:

- `HiddenSelect` makes browser autofill and form submit work. It needs the trigger ref to move focus. Keep it next to the trigger.
- The trigger typeahead works while the menu is closed.

## Worked: ComboBox

State: `useComboBoxState` from `react-stately/useComboBoxState`. Hook: `useComboBox` from `react-aria/useComboBox`. Filter: `useFilter` from `react-aria/useFilter`. Doc: <https://react-aria.adobe.com/ComboBox/useComboBox>

```tsx
import {useRef} from 'react';
import {useButton} from 'react-aria/useButton';
import {useComboBox} from 'react-aria/useComboBox';
import {useFilter} from 'react-aria/useFilter';
import {Item} from 'react-stately/Item';
import {useComboBoxState, type ComboBoxStateOptions} from 'react-stately/useComboBoxState';

function ComboBox<T extends object>(props: ComboBoxStateOptions<T> & {label: string}) {
  let {contains} = useFilter({sensitivity: 'base'});
  let state = useComboBoxState({...props, defaultFilter: contains});

  let inputRef = useRef<HTMLInputElement>(null);
  let buttonRef = useRef<HTMLButtonElement>(null);
  let listBoxRef = useRef<HTMLUListElement>(null);
  let popoverRef = useRef<HTMLDivElement>(null);

  let {labelProps, inputProps, listBoxProps, buttonProps} = useComboBox(
    {...props, inputRef, buttonRef, listBoxRef, popoverRef},
    state
  );
  let {buttonProps: triggerProps} = useButton(buttonProps, buttonRef);

  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <div>
        <input {...inputProps} ref={inputRef} />
        <button {...triggerProps} ref={buttonRef}>
          <span aria-hidden="true">▼</span>
        </button>
      </div>
      {state.isOpen && (
        <Popover state={state} triggerRef={inputRef} popoverRef={popoverRef} isNonModal placement="bottom start">
          <ListBox {...listBoxProps} state={state} listBoxRef={listBoxRef} />
        </Popover>
      )}
    </div>
  );
}

<ComboBox label="Animal" allowsCustomValue>
  <Item key="cat">Cat</Item>
  <Item key="dog">Dog</Item>
</ComboBox>;
```

| Returned | Goes on |
| --- | --- |
| `labelProps` | `<label>` (set `labelElementType` for another element) |
| `inputProps` | `<input>` with `inputRef` |
| `buttonProps` | `useButton(buttonProps, buttonRef)`, then `<button>` |
| `listBoxProps` | `useListBox` |
| `valueProps` | Element that shows selected values, for multiple selection |
| `descriptionProps`, `errorMessageProps` | Help text elements |

Props:

- Text: `inputValue`, `defaultInputValue`, `onInputChange`.
- Value: `value`, `defaultValue`, `onChange`, `selectionMode`. `selectedKey`, `defaultSelectedKey`, and `onSelectionChange` are in the types too.
- Items: `items` (controlled list, you filter), `defaultItems` (uncontrolled, the state filters with `defaultFilter`), `children`, `disabledKeys`.
- Behavior: `menuTrigger` (`'input'` default, `'focus'`, `'manual'`), `allowsCustomValue`, `allowsEmptyCollection`, `shouldCloseOnBlur`, `shouldFocusWrap`, `isOpen`-related `onOpenChange(isOpen, trigger)`.
- Required refs: `inputRef`, `listBoxRef`, `popoverRef`. Optional: `buttonRef`.

Gotchas:

- DOM focus stays on the input. List items get virtual focus through `aria-activedescendant`, which `listBoxProps` sets up. Style focused options from `isFocused`.
- The popover must be `isNonModal`. A modal popover would hide the input from screen readers and block typing.
- Anchor the popover to the input with `triggerRef={inputRef}`.
- For async data, pass `items` from `useAsyncList` and set `inputValue` and `onInputChange` to `list.filterText` and `list.setFilterText`. Do not pass `defaultFilter`, and do not filter twice.

## Worked: Menu

State: `useMenuTriggerState` and `useSubmenuTriggerState` from `react-stately/useMenuTriggerState`, `useTreeState` from `react-stately/useTreeState`. Hook: `useMenuTrigger`, `useMenu`, `useMenuItem`, `useMenuSection`, `useSubmenuTrigger` from `react-aria/useMenu`. Doc: <https://react-aria.adobe.com/Menu/useMenu>

```tsx
import {useRef} from 'react';
import {useButton} from 'react-aria/useButton';
import {
  useMenu,
  useMenuItem,
  useMenuSection,
  useMenuTrigger,
  type AriaMenuOptions
} from 'react-aria/useMenu';
import {useSeparator} from 'react-aria/useSeparator';
import type {Node} from 'react-stately';
import {Item} from 'react-stately/Item';
import {Section} from 'react-stately/Section';
import {useMenuTriggerState, type MenuTriggerProps} from 'react-stately/useMenuTriggerState';
import {useTreeState, type TreeState} from 'react-stately/useTreeState';

function MenuButton<T extends object>(
  props: MenuTriggerProps & AriaMenuOptions<T> & {label: string; children: any}
) {
  let state = useMenuTriggerState(props);
  let ref = useRef<HTMLButtonElement>(null);
  let {menuTriggerProps, menuProps} = useMenuTrigger<T>({}, state, ref);
  let {buttonProps} = useButton(menuTriggerProps, ref);
  return (
    <>
      <button {...buttonProps} ref={ref}>{props.label}</button>
      {state.isOpen && (
        <Popover state={state} triggerRef={ref} placement="bottom start">
          <Menu {...props} {...menuProps} />
        </Popover>
      )}
    </>
  );
}

function Menu<T extends object>(props: AriaMenuOptions<T> & {children: any}) {
  let state = useTreeState(props);
  let ref = useRef<HTMLUListElement>(null);
  let {menuProps} = useMenu(props, state, ref);
  return (
    <ul {...menuProps} ref={ref}>
      {[...state.collection].map(node =>
        node.type === 'section'
          ? <MenuSection key={node.key} section={node} state={state} />
          : <MenuItem key={node.key} item={node} state={state} />
      )}
    </ul>
  );
}

function MenuSection<T>({section, state}: {section: Node<T>; state: TreeState<T>}) {
  let {itemProps, headingProps, groupProps} = useMenuSection({
    heading: section.rendered,
    'aria-label': section['aria-label']
  });
  let {separatorProps} = useSeparator({elementType: 'li'});
  return (
    <>
      {section.key !== state.collection.getFirstKey() && <li {...separatorProps} />}
      <li {...itemProps}>
        {section.rendered && <span {...headingProps}>{section.rendered}</span>}
        <ul {...groupProps}>
          {[...state.collection.getChildren(section.key)].map(node => (
            <MenuItem key={node.key} item={node} state={state} />
          ))}
        </ul>
      </li>
    </>
  );
}

function MenuItem<T>({item, state}: {item: Node<T>; state: TreeState<T>}) {
  let ref = useRef<HTMLLIElement>(null);
  let {menuItemProps, isFocused, isSelected, isDisabled} = useMenuItem({key: item.key}, state, ref);
  return (
    <li
      {...menuItemProps}
      ref={ref}
      data-focused={isFocused || undefined}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}>
      {item.rendered}
    </li>
  );
}

<MenuButton label="Actions" onAction={key => console.log(key)}>
  <Section title="Edit">
    <Item key="copy">Copy</Item>
    <Item key="cut">Cut</Item>
  </Section>
</MenuButton>;
```

| Hook | Returned | Goes on |
| --- | --- | --- |
| `useMenuTrigger(props, state, ref)` | `menuTriggerProps` | `useButton`, then the trigger |
| | `menuProps` | `useMenu` (holds `onClose`, `autoFocus`, labeling) |
| `useMenu(props, treeState, ref)` | `menuProps` | `<ul>` |
| `useMenuItem({key}, treeState, ref)` | `menuItemProps` | `<li>` |
| | `labelProps`, `descriptionProps`, `keyboardShortcutProps` | Label, description, and shortcut parts of the item |
| | `isFocused`, `isFocusVisible`, `isSelected`, `isPressed`, `isDisabled` | Styling |
| `useMenuSection({heading, 'aria-label'})` | `itemProps`, `headingProps`, `groupProps` | Outer `li`, heading, inner `ul` |
| `useSubmenuTrigger(props, submenuState, ref)` | `submenuTriggerProps`, `submenuProps`, `popoverProps` | `useMenuItem`, submenu `useMenu`, submenu `Popover` |

Props:

- Trigger: `isOpen`, `defaultOpen`, `onOpenChange`, `trigger` (`'press'`, `'longPress'`, `'contextMenu'` in the state type). `useMenuTrigger` options: `type` (`'menu'` or `'listbox'`), `isDisabled`, `trigger`.
- Menu: `onAction(key, value)`, `onClose`, `selectionMode`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange`, `disallowEmptySelection`, `disabledKeys`, `items`, `shouldFocusWrap`, `autoFocus`, `escapeKeyBehavior`.
- Item: `closeOnSelect` and `shouldCloseOnSelect` both exist on `AriaMenuItemProps`, `onAction`, `isVirtualized`.

Submenu sketch:

```tsx
import {useRef} from 'react';
import {useMenuItem, useSubmenuTrigger} from 'react-aria/useMenu';
import {useSubmenuTriggerState} from 'react-stately/useMenuTriggerState';

function SubmenuItem({item, treeState, rootState, parentMenuRef, children}: any) {
  let triggerRef = useRef<HTMLLIElement>(null);
  let submenuRef = useRef<HTMLUListElement>(null);
  let submenuState = useSubmenuTriggerState({triggerKey: item.key}, rootState);
  let {submenuTriggerProps, submenuProps, popoverProps} = useSubmenuTrigger(
    {node: item, parentMenuRef, submenuRef},
    submenuState,
    triggerRef
  );
  let {menuItemProps} = useMenuItem({...submenuTriggerProps, key: item.key}, treeState, triggerRef);
  return (
    <>
      <li {...menuItemProps} ref={triggerRef}>{item.rendered}</li>
      {submenuState.isOpen && (
        <Popover {...popoverProps} state={submenuState} triggerRef={triggerRef} placement="end top">
          <Menu {...submenuProps}>{children}</Menu>
        </Popover>
      )}
    </>
  );
}
```

`rootState` is the `RootMenuTriggerState` from `useMenuTriggerState`. It tracks open submenu keys. Pass `submenuRef` to the submenu's `<ul>`. Pass it down through a context if you nest more levels. This sketch is from the types, not from a docs example.

Gotchas: pass `menuProps` from the trigger after your own props so its `onClose` wins.  Menu keys and the `onAction` key are the `Item` keys.

## Worked: Table

State: `useTableState`, `useTableColumnResizeState`, plus the collection components `TableHeader`, `TableBody`, `Column`, `Row`, `Cell`, all from `react-stately/useTableState`. Hook: `useTable`, `useTableRowGroup`, `useTableHeaderRow`, `useTableColumnHeader`, `useTableRow`, `useTableCell`, `useTableSelectionCheckbox`, `useTableSelectAllCheckbox`, `useTableColumnResize` from `react-aria/useTable`. Doc: <https://react-aria.adobe.com/Table/useTable>

```tsx
import {useRef} from 'react';
import {useCheckbox} from 'react-aria/useCheckbox';
import {useFocusRing} from 'react-aria/useFocusRing';
import {mergeProps} from 'react-aria/mergeProps';
import {
  useTable,
  useTableCell,
  useTableColumnHeader,
  useTableHeaderRow,
  useTableRow,
  useTableRowGroup,
  useTableSelectAllCheckbox,
  useTableSelectionCheckbox
} from 'react-aria/useTable';
import {VisuallyHidden} from 'react-aria/VisuallyHidden';
import {
  Cell,
  Column,
  Row,
  TableBody,
  TableHeader,
  useTableState,
  type TableState,
  type TableStateProps
} from 'react-stately/useTableState';
import {useToggleState} from 'react-stately/useToggleState';

type GridNode<T> = TableState<T>['collection']['columns'][number];
type CellsProps<T> = {node: GridNode<T>; state: TableState<T>};

function Table<T extends object>(props: TableStateProps<T> & {'aria-label': string}) {
  let state = useTableState({
    ...props,
    showSelectionCheckboxes: props.selectionMode === 'multiple'
  });
  let ref = useRef<HTMLTableElement>(null);
  let {gridProps} = useTable(props, state, ref);
  let {collection} = state;
  return (
    <table {...gridProps} ref={ref}>
      <RowGroup type="thead">
        {collection.headerRows.map(headerRow => (
          <HeaderRow key={headerRow.key} node={headerRow} state={state} />
        ))}
      </RowGroup>
      <RowGroup type="tbody">
        {[...collection.getChildren(collection.body.key)].map(row => (
          <BodyRow key={row.key} node={row} state={state} />
        ))}
      </RowGroup>
    </table>
  );
}

function RowGroup({type: Element, children}: {type: 'thead' | 'tbody'; children: React.ReactNode}) {
  let {rowGroupProps} = useTableRowGroup();
  return <Element {...rowGroupProps}>{children}</Element>;
}

function HeaderRow<T>({node, state}: CellsProps<T>) {
  let ref = useRef<HTMLTableRowElement>(null);
  let {rowProps} = useTableHeaderRow({node}, state, ref);
  return (
    <tr {...rowProps} ref={ref}>
      {[...state.collection.getChildren(node.key)].map(column =>
        column.props.isSelectionCell
          ? <SelectAllCell key={column.key} node={column} state={state} />
          : <ColumnHeader key={column.key} node={column} state={state} />
      )}
    </tr>
  );
}

function ColumnHeader<T>({node, state}: CellsProps<T>) {
  let ref = useRef<HTMLTableCellElement>(null);
  let {columnHeaderProps} = useTableColumnHeader({node}, state, ref);
  let {isFocusVisible, focusProps} = useFocusRing();
  let sorted = state.sortDescriptor?.column === node.key ? state.sortDescriptor.direction : undefined;
  return (
    <th
      {...mergeProps(columnHeaderProps, focusProps)}
      ref={ref}
      colSpan={node.colSpan}
      data-focus-visible={isFocusVisible || undefined}>
      {node.rendered}
      {node.props.allowsSorting && <span aria-hidden="true">{sorted === 'ascending' ? '▲' : sorted ? '▼' : ''}</span>}
    </th>
  );
}

function BodyRow<T>({node, state}: CellsProps<T>) {
  let ref = useRef<HTMLTableRowElement>(null);
  let {rowProps, isSelected, isPressed} = useTableRow({node}, state, ref);
  let {isFocusVisible, focusProps} = useFocusRing();
  return (
    <tr
      {...mergeProps(rowProps, focusProps)}
      ref={ref}
      data-selected={isSelected || undefined}
      data-pressed={isPressed || undefined}
      data-focus-visible={isFocusVisible || undefined}>
      {[...state.collection.getChildren(node.key)].map(cell =>
        cell.props.isSelectionCell
          ? <SelectionCell key={cell.key} node={cell} state={state} />
          : <TableCell key={cell.key} node={cell} state={state} />
      )}
    </tr>
  );
}

function TableCell<T>({node, state}: CellsProps<T>) {
  let ref = useRef<HTMLTableCellElement>(null);
  let {gridCellProps} = useTableCell({node}, state, ref);
  let {isFocusVisible, focusProps} = useFocusRing();
  return (
    <td {...mergeProps(gridCellProps, focusProps)} ref={ref} data-focus-visible={isFocusVisible || undefined}>
      {node.rendered}
    </td>
  );
}

function SelectAllCell<T>({node, state}: CellsProps<T>) {
  let ref = useRef<HTMLTableCellElement>(null);
  let {columnHeaderProps} = useTableColumnHeader({node}, state, ref);
  let {checkboxProps} = useTableSelectAllCheckbox(state);
  let inputRef = useRef<HTMLInputElement>(null);
  let {inputProps} = useCheckbox(checkboxProps, useToggleState(checkboxProps), inputRef);
  return (
    <th {...columnHeaderProps} ref={ref}>
      {state.selectionManager.selectionMode === 'single'
        ? <VisuallyHidden>{inputProps['aria-label']}</VisuallyHidden>
        : <input {...inputProps} ref={inputRef} />}
    </th>
  );
}

function SelectionCell<T>({node, state}: CellsProps<T>) {
  let ref = useRef<HTMLTableCellElement>(null);
  let {gridCellProps} = useTableCell({node}, state, ref);
  let {checkboxProps} = useTableSelectionCheckbox({key: node.parentKey}, state);
  let inputRef = useRef<HTMLInputElement>(null);
  let {inputProps} = useCheckbox(checkboxProps, useToggleState(checkboxProps), inputRef);
  return (
    <td {...gridCellProps} ref={ref}>
      <input {...inputProps} ref={inputRef} />
    </td>
  );
}

<Table aria-label="People" selectionMode="multiple">
  <TableHeader>
    <Column isRowHeader allowsSorting>Name</Column>
    <Column>Role</Column>
  </TableHeader>
  <TableBody>
    <Row key="1"><Cell>Ana</Cell><Cell>Admin</Cell></Row>
    <Row key="2"><Cell>Ivan</Cell><Cell>Editor</Cell></Row>
  </TableBody>
</Table>;
```

| Hook | Returned | Goes on |
| --- | --- | --- |
| `useTable(props, state, ref)` | `gridProps` | `<table>` |
| `useTableRowGroup()` | `rowGroupProps` | `<thead>`, `<tbody>` |
| `useTableHeaderRow({node}, state, ref)` | `rowProps` | Header `<tr>` |
| `useTableColumnHeader({node}, state, ref)` | `columnHeaderProps`, `isPressed` | `<th>` |
| `useTableRow({node}, state, ref)` | `rowProps`, `isPressed`, `isSelected`, `isFocused`, `isDisabled`, `allowsSelection`, `hasAction`, `expandButtonProps` | Body `<tr>`. `expandButtonProps` goes through `useButton`. |
| `useTableCell({node}, state, ref)` | `gridCellProps`, `isPressed` | `<td>` |
| `useTableSelectionCheckbox({key}, state)` | `checkboxProps` | `useToggleState` and `useCheckbox` |
| `useTableSelectAllCheckbox(state)` | `checkboxProps` | `useToggleState` and `useCheckbox` |
| `useTableColumnResize(props, resizeState, ref)` | `resizerProps`, `inputProps`, `isResizing`, `isMouseResizing` | Resizer element and hidden `<input>` |

Props:

- `useTableState`: `children` (`[TableHeader, TableBody]`) or `collection`, `selectionMode`, `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange`, `disabledKeys`, `disabledBehavior`, `sortDescriptor`, `onSortChange`, `showSelectionCheckboxes`, `showDragButtons`, `treeColumn`, `expandedKeys`, `defaultExpandedKeys`, `onExpandedChange`.
- `useTable`: `aria-label`, `focusMode` (`'row'` default or `'cell'`), `keyboardNavigationBehavior` (`'arrow'` default or `'tab'`), `onRowAction`, `onCellAction`, `scrollRef`, `isVirtualized`, `disallowTypeAhead`, `getRowText`, `escapeKeyBehavior`, `shouldSelectOnPressUp`, `layoutDelegate`.
- `TableHeader`: `columns`, `children`. `Column`: `title`, `children`, `childColumns`, `isRowHeader`, `allowsSorting`, `allowsResizing`, `width`, `minWidth`, `maxWidth`, `defaultWidth`, `textValue`. `TableBody`: `items`, `children`, `loadingState`, `onLoadMore`. `Row`: `children`, `textValue`, link props. `Cell`: `children`, `textValue`, `colSpan`.

Dynamic data:

```tsx
<TableHeader columns={columns}>
  {column => <Column isRowHeader={column.isRowHeader}>{column.name}</Column>}
</TableHeader>;
<TableBody items={rows}>
  {row => <Row>{columnKey => <Cell>{row[columnKey]}</Cell>}</Row>}
</TableBody>;
```

Column resizing:

```tsx
import {useRef} from 'react';
import {useTableColumnResize} from 'react-aria/useTable';
import {VisuallyHidden} from 'react-aria/VisuallyHidden';
import {useTableColumnResizeState} from 'react-stately/useTableState';

function Resizer({column, state, tableWidth}: any) {
  let layoutState = useTableColumnResizeState({tableWidth}, state);
  let inputRef = useRef<HTMLInputElement>(null);
  let {resizerProps, inputProps, isResizing} = useTableColumnResize(
    {column, 'aria-label': 'Resize column'},
    layoutState,
    inputRef
  );
  return (
    <div {...resizerProps} data-resizing={isResizing || undefined} style={{cursor: 'col-resize'}}>
      <VisuallyHidden>
        <input ref={inputRef} {...inputProps} />
      </VisuallyHidden>
    </div>
  );
}
```

Share one `layoutState` for all columns in real code. Read widths with `layoutState.getColumnWidth(key)`.

Gotchas:

- Mark a `Column` with `isRowHeader`. Screen readers read that cell to name the row. With none marked, the first data column is used.
- `sort` runs from `state.sort(columnKey, direction)`, which header press calls. You still sort the data yourself in `onSortChange`.
- Interactive content in a cell is reached with arrows. Use `keyboardNavigationBehavior="tab"` to reach it by Tab.
- Selection cells appear only when `showSelectionCheckboxes` is true.

## Worked: Tabs

State: `useTabListState` from `react-stately/useTabListState`. Hook: `useTabList`, `useTab`, `useTabPanel` from `react-aria/useTabList`. Doc: <https://react-aria.adobe.com/Tabs/useTabList>

```tsx
import {useRef} from 'react';
import {useFocusRing} from 'react-aria/useFocusRing';
import {mergeProps} from 'react-aria/mergeProps';
import {useTab, useTabList, useTabPanel, type AriaTabListOptions} from 'react-aria/useTabList';
import type {Node} from 'react-stately';
import {Item} from 'react-stately/Item';
import {useTabListState, type TabListState} from 'react-stately/useTabListState';

function Tabs<T extends object>(props: AriaTabListOptions<T> & {children: any}) {
  let state = useTabListState(props);
  let ref = useRef<HTMLDivElement>(null);
  let {tabListProps} = useTabList(props, state, ref);
  return (
    <div>
      <div {...tabListProps} ref={ref}>
        {[...state.collection].map(item => (
          <Tab key={item.key} item={item} state={state} />
        ))}
      </div>
      <TabPanel key={state.selectedItem?.key} state={state} />
    </div>
  );
}

function Tab<T>({item, state}: {item: Node<T>; state: TabListState<T>}) {
  let ref = useRef<HTMLDivElement>(null);
  let {tabProps, isSelected, isDisabled} = useTab({key: item.key}, state, ref);
  let {isFocusVisible, focusProps} = useFocusRing();
  return (
    <div
      {...mergeProps(tabProps, focusProps)}
      ref={ref}
      data-selected={isSelected || undefined}
      data-disabled={isDisabled || undefined}
      data-focus-visible={isFocusVisible || undefined}>
      {item.rendered}
    </div>
  );
}

function TabPanel<T>({state}: {state: TabListState<T>}) {
  let ref = useRef<HTMLDivElement>(null);
  let {tabPanelProps} = useTabPanel({}, state, ref);
  return <div {...tabPanelProps} ref={ref}>{state.selectedItem?.props.children}</div>;
}

<Tabs aria-label="History">
  <Item key="founding" title="Founding">First panel</Item>
  <Item key="empire" title="Empire">Second panel</Item>
</Tabs>;
```

| Hook | Returned | Goes on |
| --- | --- | --- |
| `useTabList(props, state, ref)` | `tabListProps` | Tab list container |
| `useTab({key}, state, ref)` | `tabProps`, `isSelected`, `isDisabled`, `isPressed` | Each tab |
| `useTabPanel({id}, state, ref)` | `tabPanelProps` | Panel |

Props: `selectedKey`, `defaultSelectedKey`, `onSelectionChange` (the key is never null), `keyboardActivation` (`'automatic'` default, or `'manual'`), `orientation`, `isDisabled`, `disabledKeys`, `items`, `aria-label`.

Gotchas:

- `title` is the tab content and `children` is the panel content. `item.rendered` returns `title`, and `selectedItem.props.children` returns the panel.
- `key` on `TabPanel` remounts it on tab change and keeps `aria-labelledby` and tabbable-child detection correct.
- The panel sets `tabIndex={0}` by itself when it has no tabbable children.
- `useTabPanel` accepts `state: null`, and `id` to pin a panel to one tab, so several panels can stay mounted.
- Arrow keys move focus. They follow `orientation`, and left and right swap in RTL.

## Worked: Slider

State: `useSliderState` from `react-stately/useSliderState`. Hook: `useSlider`, `useSliderThumb` from `react-aria/useSlider`. Doc: <https://react-aria.adobe.com/Slider/useSlider>

```tsx
import {useRef, type RefObject} from 'react';
import {useFocusRing} from 'react-aria/useFocusRing';
import {mergeProps} from 'react-aria/mergeProps';
import {useNumberFormatter} from 'react-aria/useNumberFormatter';
import {useSlider, useSliderThumb, type AriaSliderProps} from 'react-aria/useSlider';
import {VisuallyHidden} from 'react-aria/VisuallyHidden';
import {useSliderState, type SliderState} from 'react-stately/useSliderState';

function Slider(props: AriaSliderProps<number | number[]> & {formatOptions?: Intl.NumberFormatOptions}) {
  let trackRef = useRef<HTMLDivElement>(null);
  let numberFormatter = useNumberFormatter(props.formatOptions);
  let state = useSliderState({...props, numberFormatter});
  let {groupProps, trackProps, labelProps, outputProps} = useSlider(props, state, trackRef);
  return (
    <div {...groupProps}>
      {props.label && <label {...labelProps}>{props.label}</label>}
      <output {...outputProps}>{state.values.map((_, i) => state.getThumbValueLabel(i)).join(' – ')}</output>
      <div {...trackProps} ref={trackRef} style={{position: 'relative', height: 30, width: '100%'}}>
        {state.values.map((_, index) => (
          <Thumb key={index} index={index} state={state} trackRef={trackRef} />
        ))}
      </div>
    </div>
  );
}

function Thumb({index, state, trackRef}: {index: number; state: SliderState; trackRef: RefObject<HTMLDivElement | null>}) {
  let inputRef = useRef<HTMLInputElement>(null);
  let {thumbProps, inputProps, isDragging} = useSliderThumb({index, trackRef, inputRef}, state);
  let {focusProps, isFocusVisible} = useFocusRing();
  return (
    <div
      {...thumbProps}
      data-dragging={isDragging || undefined}
      data-focus-visible={isFocusVisible || undefined}>
      <VisuallyHidden>
        <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
      </VisuallyHidden>
    </div>
  );
}

<Slider label="Opacity" defaultValue={60} />;
<Slider label="Range" defaultValue={[20, 80]} formatOptions={{style: 'currency', currency: 'USD'}} />;
```

| Hook | Returned | Goes on |
| --- | --- | --- |
| `useSlider(props, state, trackRef)` | `groupProps` | Root |
| | `labelProps` | `<label>` |
| | `trackProps` | Track, with `trackRef` |
| | `outputProps` | `<output>` |
| `useSliderThumb(opts, state)` | `thumbProps` | Thumb. Sets `position: absolute`, `left` or `top` in percent, a centering `transform`, and `touchAction: none`. |
| | `inputProps` | Hidden range `<input>`, with `inputRef` |
| | `labelProps` | Optional per-thumb label |
| | `isDragging`, `isFocused`, `isDisabled` | Styling |

Props:

- `useSliderState`: `value`, `defaultValue`, `onChange`, `onChangeEnd`, `minValue` (0), `maxValue` (100), `step` (1), `orientation`, `isDisabled`, `numberFormatter` (required).
- `useSliderThumb`: `trackRef`, `inputRef` (required), `index` (0), `isDisabled`, `name`, `form`, `label`, `aria-label`, `orientation`, `autoFocus`.

State helpers: `values`, `getThumbValue(i)`, `setThumbValue(i, v)`, `getThumbPercent(i)`, `getValuePercent(v)`, `getThumbValueLabel(i)`, `getFormattedValue(v)`, `getThumbMinValue(i)`, `getThumbMaxValue(i)`, `incrementThumb(i)`, `decrementThumb(i)`, `step`, `pageSize`.

Gotchas:

- The value shape follows the input: a number stays a number, an array stays an array. Use one thumb per value.
- Build a fill with `state.getThumbPercent(i)`.
- For a vertical slider, give the track a height and pass `orientation="vertical"`. The thumb then uses `top`.
- For a range, give each thumb an `aria-label` such as "Minimum".
- The input is the focus target. Put `focusProps` on the input and style the thumb from `isFocusVisible`.

## Worked: Calendar and RangeCalendar

State: `useCalendarState` from `react-stately/useCalendarState`, `useRangeCalendarState` from `react-stately/useRangeCalendarState`. Hook: `useCalendar`, `useCalendarGrid`, `useCalendarCell`, `useCalendarHeading`, `useCalendarMonthPicker`, `useCalendarYearPicker` from `react-aria/useCalendar`. `useRangeCalendar` and the same helpers from `react-aria/useRangeCalendar`. Docs: <https://react-aria.adobe.com/Calendar/useCalendar>, <https://react-aria.adobe.com/RangeCalendar/useRangeCalendar>

```tsx
import {createCalendar, type CalendarDate} from '@internationalized/date';
import {useRef} from 'react';
import {useLocale} from 'react-aria/I18nProvider';
import {
  useCalendar,
  useCalendarCell,
  useCalendarGrid,
  type AriaCalendarGridProps,
  type AriaCalendarProps
} from 'react-aria/useCalendar';
import type {DateValue} from 'react-stately/useCalendarState';
import {useCalendarState, type CalendarState} from 'react-stately/useCalendarState';

function Calendar<T extends DateValue>(props: AriaCalendarProps<T>) {
  let {locale} = useLocale();
  let state = useCalendarState({...props, locale, createCalendar});
  let {calendarProps, prevButtonProps, nextButtonProps, errorMessageProps, title} = useCalendar(props, state);
  return (
    <div {...calendarProps}>
      <header>
        <h2>{title}</h2>
        <Button {...prevButtonProps}>‹</Button>
        <Button {...nextButtonProps}>›</Button>
      </header>
      <CalendarGrid state={state} />
      {state.isValueInvalid && <div {...errorMessageProps}>{props.errorMessage}</div>}
    </div>
  );
}

function CalendarGrid({state, ...props}: AriaCalendarGridProps & {state: CalendarState}) {
  let {gridProps, headerProps, weekDays, weeksInMonth} = useCalendarGrid(props, state);
  return (
    <table {...gridProps}>
      <thead {...headerProps}>
        <tr>
          {weekDays.map((day, i) => <th key={i}>{day}</th>)}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeksInMonth).keys()].map(weekIndex => (
          <tr key={weekIndex}>
            {state.getDatesInWeek(weekIndex, props.startDate).map((date, i) =>
              date ? <CalendarCell key={i} state={state} date={date} /> : <td key={i} />
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CalendarCell({state, date}: {state: CalendarState; date: CalendarDate}) {
  let ref = useRef<HTMLDivElement>(null);
  let {cellProps, buttonProps, isSelected, isOutsideVisibleRange, isDisabled, isUnavailable, formattedDate} =
    useCalendarCell({date}, state, ref);
  return (
    <td {...cellProps}>
      <div
        {...buttonProps}
        ref={ref}
        hidden={isOutsideVisibleRange}
        data-selected={isSelected || undefined}
        data-disabled={isDisabled || undefined}
        data-unavailable={isUnavailable || undefined}>
        {formattedDate}
      </div>
    </td>
  );
}

<Calendar aria-label="Event date" />;
```

| Hook | Returned | Goes on |
| --- | --- | --- |
| `useCalendar(props, state)` | `calendarProps` | Root |
| | `prevButtonProps`, `nextButtonProps` | `useButton`, then each button |
| | `errorMessageProps` | Error element |
| | `title` | Heading text for the visible range |
| `useCalendarGrid(props, state)` | `gridProps` | `<table>` |
| | `headerProps` | `<thead>` |
| | `weekDays` (`string[]`), `weeksInMonth` | Loop values |
| `useCalendarCell({date}, state, ref)` | `cellProps` | `<td>` |
| | `buttonProps` | Inner `div`. Already DOM props: spread them directly. |
| | `isPressed`, `isSelected`, `isFocused`, `isDisabled`, `isUnavailable`, `isOutsideVisibleRange`, `isInvalid`, `formattedDate` | Styling and text |
| `useCalendarHeading(props, state)` | `string` | Heading text. Options: `offset`, `format`. |
| `useCalendarMonthPicker(props, state)` | `aria-label`, `value`, `onChange`, `items` (`{id, date, formatted}`) | Spread on your own select |
| `useCalendarYearPicker(props, state)` | Same shape. Options: `visibleYears`, `format`. | Spread on your own select |

Props:

- `useCalendarState` needs `locale` and `createCalendar`. Value: `value`, `defaultValue`, `onChange`, `selectionMode` (`'single'` default, or `'multiple'`). Limits: `minValue`, `maxValue`, `isDateUnavailable`. Focus: `focusedValue`, `defaultFocusedValue`, `onFocusChange`, `autoFocus`. Other: `isDisabled`, `isReadOnly`, `isInvalid`, `errorMessage`, `pageBehavior` (`'visible'` or `'single'`), `firstDayOfWeek`, `weeksInMonth`, `visibleDuration`, `selectionAlignment`.
- `useCalendarGrid`: `startDate`, `endDate`, `weekdayStyle`, `firstDayOfWeek`.
- `useCalendarCell`: `date`, `isDisabled`, `isOutsideMonth`.

Multiple months: pass `visibleDuration: {months: 3}`, then render one grid per month with a `startDate`:

```tsx
<>
  {[0, 1, 2].map(offset => (
    <CalendarGrid key={offset} state={state} startDate={state.visibleRange.start.add({months: offset})} />
  ))}
</>;
```

RangeCalendar differs in only these places:

```tsx
import {createCalendar} from '@internationalized/date';
import {useRef} from 'react';
import {useLocale} from 'react-aria/I18nProvider';
import {useRangeCalendar} from 'react-aria/useRangeCalendar';
import {useRangeCalendarState} from 'react-stately/useRangeCalendarState';

function RangeCalendar(props: any) {
  let {locale} = useLocale();
  let state = useRangeCalendarState({...props, locale, createCalendar});
  let ref = useRef<HTMLDivElement>(null);
  let {calendarProps, prevButtonProps, nextButtonProps, title} = useRangeCalendar(props, state, ref);
  return <div {...calendarProps} ref={ref}>{title}</div>;
}
```

Extra range props: `allowsNonContiguousRanges`, `commitBehavior` (`'clear'`, `'reset'`, `'select'`), `isDateUnavailable(date, anchorDate)`. Value: `{start, end} | null`. In the cell, use `state.highlightedRange` to mark selection start, end, and middle. Reuse `CalendarGrid` and `CalendarCell`: their hooks accept both state types.

Gotchas:

- The `aria-label` or `aria-labelledby` on the root is required. There is no visible label.
- The `<td>` must stay in the DOM for layout. Hide the inner `div` with `hidden={isOutsideVisibleRange}`.
- Values are `@internationalized/date` objects, not `Date`.
- `createCalendar` includes all calendar systems. To cut bundle size, pass a function that returns only the calendars you need.

## Worked: DateField, DatePicker, DateRangePicker

State: `useDateFieldState`, `useTimeFieldState`, `useDatePickerState`, `useDateRangePickerState`, each from its own subpath. Hook: `useDateField` and `useDateSegment` from `react-aria/useDateField`, `useTimeField` and `useDateSegment` from `react-aria/useTimeField`, `useDatePicker`, `useDateRangePicker`. Docs: <https://react-aria.adobe.com/DatePicker/useDatePicker>, <https://react-aria.adobe.com/DateField/useDateField>, <https://react-aria.adobe.com/DateRangePicker/useDateRangePicker>, <https://react-aria.adobe.com/TimeField/useTimeField>

```tsx
import {createCalendar} from '@internationalized/date';
import {useRef} from 'react';
import {useLocale} from 'react-aria/I18nProvider';
import {useDateField, useDateSegment, type AriaDateFieldProps} from 'react-aria/useDateField';
import {useDatePicker, type AriaDatePickerProps} from 'react-aria/useDatePicker';
import {useDateFieldState, type DateFieldState, type DateSegment as Segment} from 'react-stately/useDateFieldState';
import {useDatePickerState, type DateValue} from 'react-stately/useDatePickerState';

function DatePicker<T extends DateValue>(props: AriaDatePickerProps<T>) {
  let state = useDatePickerState(props);
  let ref = useRef<HTMLDivElement>(null);
  let {groupProps, labelProps, fieldProps, buttonProps, dialogProps, calendarProps} = useDatePicker(props, state, ref);
  return (
    <div>
      <span {...labelProps}>{props.label}</span>
      <div {...groupProps} ref={ref}>
        <DateField {...fieldProps} />
        <Button {...buttonProps}>▼</Button>
      </div>
      {state.isOpen && (
        <Popover state={state} triggerRef={ref} placement="bottom start">
          <Dialog {...dialogProps}>
            <Calendar {...calendarProps} />
          </Dialog>
        </Popover>
      )}
    </div>
  );
}

function DateField<T extends DateValue>(props: AriaDateFieldProps<T>) {
  let {locale} = useLocale();
  let state = useDateFieldState({...props, locale, createCalendar});
  let ref = useRef<HTMLDivElement>(null);
  let inputRef = useRef<HTMLInputElement>(null);
  let {labelProps, fieldProps, inputProps} = useDateField({...props, inputRef}, state, ref);
  return (
    <div>
      {props.label && <span {...labelProps}>{props.label}</span>}
      <div {...fieldProps} ref={ref}>
        {state.segments.map((segment, i) => (
          <DateSegment key={i} segment={segment} state={state} />
        ))}
      </div>
      <input {...inputProps} ref={inputRef} />
    </div>
  );
}

function DateSegment({segment, state}: {segment: Segment; state: DateFieldState}) {
  let ref = useRef<HTMLDivElement>(null);
  let {segmentProps} = useDateSegment(segment, state, ref);
  return (
    <div
      {...segmentProps}
      ref={ref}
      style={{...segmentProps.style, display: 'inline-block'}}
      data-placeholder={segment.isPlaceholder || undefined}>
      {segment.text}
    </div>
  );
}

<DatePicker label="Event date" granularity="day" />;
```

The chain is the point of this pattern:

| `useDatePicker` returned | Goes on |
| --- | --- |
| `labelProps` | `span` (not `<label>`: the target is a group) |
| `groupProps` | Group wrapper, with `ref`. Popover anchors to it. |
| `fieldProps` | Your `DateField`, which calls `useDateFieldState` and `useDateField` |
| `buttonProps` | `useButton`, then the calendar button |
| `dialogProps` | `useDialog` |
| `calendarProps` | Your `Calendar`, which calls `useCalendarState` and `useCalendar` |
| `descriptionProps`, `errorMessageProps` | Help text elements |

| `useDateField` returned | Goes on |
| --- | --- |
| `labelProps` | Label |
| `fieldProps` | Group element with `ref`. Holds the segments. |
| `inputProps` | Hidden `<input>` for forms and autofill |
| `descriptionProps`, `errorMessageProps` | Help text elements |

`useDateSegment(segment, state, ref)` returns `segmentProps` for each segment, including literals.

Props:

- Value: `value`, `defaultValue`, `onChange`. Limits: `minValue`, `maxValue`, `isDateUnavailable`, `placeholderValue`.
- Format: `granularity` (`'day'`, `'hour'`, `'minute'`, `'second'`), `hourCycle`, `hideTimeZone`, `shouldForceLeadingZeros`.
- Popover: `isOpen`, `defaultOpen`, `onOpenChange`, `shouldCloseOnSelect`.
- Form: `name`, `form`, `isRequired`, `validate`, `validationBehavior`, `isDisabled`, `isReadOnly`, `isInvalid`.
- Date field state also takes `maxGranularity` (`'year'`, `'month'`, or a granularity).
- Calendar side: `pageBehavior`, `firstDayOfWeek`.

TimeField: `useTimeFieldState({...props, locale})` (no `createCalendar`), `useTimeField(props, state, ref)`. Value is `Time` (or a date-time type). Same return shape as `useDateField`, and same `DateSegment`.

DateRangePicker: same chain with two fields.

```tsx
import {useRef} from 'react';
import {useDateRangePicker} from 'react-aria/useDateRangePicker';
import {useDateRangePickerState} from 'react-stately/useDateRangePickerState';

function DateRangePicker(props: any) {
  let state = useDateRangePickerState(props);
  let ref = useRef<HTMLDivElement>(null);
  let {groupProps, labelProps, startFieldProps, endFieldProps, buttonProps, dialogProps, calendarProps} =
    useDateRangePicker(props, state, ref);
  return (
    <div>
      <span {...labelProps}>{props.label}</span>
      <div {...groupProps} ref={ref}>
        <DateField {...startFieldProps} />
        <span aria-hidden="true">–</span>
        <DateField {...endFieldProps} />
        <Button {...buttonProps}>▼</Button>
      </div>
      {state.isOpen && (
        <Popover state={state} triggerRef={ref} placement="bottom start">
          <Dialog {...dialogProps}>
            <RangeCalendar {...calendarProps} />
          </Dialog>
        </Popover>
      )}
    </div>
  );
}
```

Range props: `value`/`defaultValue`/`onChange` with `{start, end}`, `allowsNonContiguousRanges`, `startName`, `endName`, `form`.

Gotchas:

- Render one `div` per segment with `contentEditable` from `segmentProps`, and keep `segment.text`. Do not replace the segments with an `<input>`.
- Spread `segmentProps.style` before your own style. It sets `caretColor: transparent`.
- Tabular digits (`font-variant-numeric: tabular-nums`) and padding on editable segments keep the layout steady as digits change.
- The locale controls segment order. Do not sort or filter them. Literals such as `/` are part of the list.
- `useDatePickerState` needs no `locale`, but `useDateFieldState` and `useCalendarState` do.

## Hook table

State import: `react-stately/<state hook>`. Hook import: the subpath named in the Doc column, for example `react-aria/useRadioGroup`. "None" means no state hook. Doc URL: `https://react-aria.adobe.com/<Doc>`.

| Hook (from `react-aria/...`) | State hook | Returned props and where each goes | Doc |
| --- | --- | --- | --- |
| `useButton(props, ref)` (from `useButton`) | None | `buttonProps` on the element. `isPressed`. | `Button/useButton` |
| `useLink(props, ref)` (from `useLink`) | None | `linkProps` on `<a>` or `elementType`. `isPressed`. | `Link/useLink` |
| `useToggleButton(props, state, ref)` (from `useToggleButton`) | `useToggleState` | `buttonProps` on `<button>`. `isPressed`, `isSelected`, `isDisabled`. | `ToggleButton/useToggleButton` |
| `useToggleButtonGroup(props, state, ref)` (from `useToggleButtonGroup`) | `useToggleGroupState` | `groupProps` on the container | `ToggleButtonGroup/useToggleButtonGroup` |
| `useToggleButtonGroupItem({id}, state, ref)` | Same group state | `buttonProps` on the button. Same flags. | Same page |
| `useCheckbox(props, state, ref)` (from `useCheckbox`) | `useToggleState` | `labelProps` on `<label>`, `inputProps` on `<input>`, `descriptionProps`, `errorMessageProps`. `isSelected`, `isPressed`, `isDisabled`, `isReadOnly`, validation fields. | `Checkbox/useCheckbox` |
| `useCheckboxGroup(props, state)` (from `useCheckboxGroup`) | `useCheckboxGroupState` | `groupProps` on the container, `labelProps`, `descriptionProps`, `errorMessageProps` | `CheckboxGroup/useCheckboxGroup` |
| `useCheckboxGroupItem({value}, state, ref)` | Same group state | Same return as `useCheckbox` | Same page |
| `useSwitch(props, state, ref)` (from `useSwitch`) | `useToggleState` | Same return as `useCheckbox`. Input has `role="switch"`. | `Switch/useSwitch` |
| `useRadioGroup(props, state)` (from `useRadioGroup`) | `useRadioGroupState` | `radioGroupProps` on the container, `labelProps`, `descriptionProps`, `errorMessageProps` | `RadioGroup/useRadioGroup` |
| `useRadio({value}, state, ref)` | Same group state | `labelProps` on `<label>`, `inputProps` on `<input>`, `descriptionProps`. `isSelected`, `isDisabled`, `isPressed`. | Same page |
| `useTextField(props, ref)` (from `useTextField`) | None | `labelProps`, `inputProps` on `<input>` or `<textarea>`, `descriptionProps`, `errorMessageProps`, validation fields | `TextField/useTextField` |
| `useSearchField(props, state, ref)` (from `useSearchField`) | `useSearchFieldState` | `labelProps`, `inputProps`, `clearButtonProps` (to `useButton`), `descriptionProps`, `errorMessageProps` | `SearchField/useSearchField` |
| `useNumberField(props, state, ref)` (from `useNumberField`) | `useNumberFieldState` (needs `locale`) | `labelProps`, `groupProps`, `inputProps`, `incrementButtonProps` and `decrementButtonProps` (to `useButton`), `descriptionProps`, `errorMessageProps` | `NumberField/useNumberField` |
| `useListBox(props, state, ref)` (from `useListBox`) | `useListState` | `listBoxProps` on `<ul>`, `labelProps` | `ListBox/useListBox` |
| `useOption({key}, state, ref)` | Same list state | `optionProps` on `<li>`, `labelProps`, `descriptionProps`, state flags | Same page |
| `useListBoxSection({heading})` | None | `itemProps` on outer `<li>`, `headingProps`, `groupProps` on inner `<ul>` | Same page |
| `useGridList(props, state, ref)` (from `useGridList`) | `useListState` | `gridProps` on the container | `GridList/useGridList` |
| `useGridListItem({node}, state, ref)` | Same list state, or `TreeState` | `rowProps` on the row, `gridCellProps` on its single cell, `descriptionProps`, state flags | Same page |
| `useGridListSelectionCheckbox({key}, state)` | Same list state | `checkboxProps` to `useToggleState` and `useCheckbox` | Same page |
| `useGridListSection(props, state, ref)` | Same list state | `rowProps`, `rowHeaderProps`, `rowGroupProps` | Same page |
| `useTagGroup(props, state, ref)` (from `useTagGroup`) | `useListState` | `gridProps` on the list, `labelProps`, `descriptionProps`, `errorMessageProps` | `TagGroup/useTagGroup` |
| `useTag({item}, state, ref)` | Same list state | `rowProps` on the tag, `gridCellProps` on its cell, `removeButtonProps` (to `useButton`), `allowsRemoving`, state flags | Same page |
| `useBreadcrumbs(props)` (from `useBreadcrumbs`) | None | `navProps` on `<nav>` | `Breadcrumbs/useBreadcrumbs` |
| `useBreadcrumbItem(props, ref)` | None | `itemProps` on the link inside each `<li>` | Same page |
| `useDisclosure(props, state, panelRef)` (from `useDisclosure`) | `useDisclosureState` | `buttonProps` (to `useButton`), `panelProps` on the panel. The ref is the **panel** ref. | `Disclosure/useDisclosure` |
| `useMeter(props)` (from `useMeter`) | None | `meterProps` on the root, `labelProps` | `Meter/useMeter` |
| `useProgressBar(props)` (from `useProgressBar`) | None | `progressBarProps` on the root, `labelProps` | `ProgressBar/useProgressBar` |
| `useSeparator(props)` (from `useSeparator`) | None | `separatorProps` on the element | `Separator/useSeparator` |
| `useToolbar(props, ref)` (from `useToolbar`) | None | `toolbarProps` on the container | `Toolbar/useToolbar` |
| `useTooltipTrigger(props, state, ref)` (from `useTooltipTrigger`) | `useTooltipTriggerState` | `triggerProps` on the trigger, `tooltipProps` to `useTooltip` | `Tooltip/useTooltipTrigger` |
| `useTooltip(props, state)` | Same state (optional) | `tooltipProps` on the tooltip | Same page |
| `useModalOverlay(props, state, ref)` (from `useModalOverlay`) | `useOverlayTriggerState` | `modalProps` on the modal, `underlayProps` on the underlay | `Modal/useModalOverlay` |
| `usePopover(props, state)` (from `usePopover`) | `useOverlayTriggerState` | `popoverProps` on the popover, `underlayProps`, `arrowProps`, `placement`, `triggerAnchorPoint` | `Popover/usePopover` |
| `useToastRegion(props, state, ref)` (from `useToast`) | `useToastState` or `useToastQueue` | `regionProps` on the region | `Toast/useToast` |
| `useToast({toast}, state, ref)` | Same state | `toastProps`, `contentProps`, `titleProps`, `descriptionProps`, `closeButtonProps` (to `useButton`) | Same page |
| `useColorArea(opts, state)` (from `useColorArea`) | `useColorAreaState` | `colorAreaProps` on the root with `containerRef`, `thumbProps` on the thumb, `xInputProps` and `yInputProps` on two inputs | `ColorArea/useColorArea` |
| `useColorField(props, state, ref)` (from `useColorField`) | `useColorFieldState` | `labelProps`, `inputProps`, `descriptionProps`, `errorMessageProps` | `ColorField/useColorField` |
| `useColorChannelField(props, state, ref)` (from `useColorField`) | `useColorChannelFieldState` (from `react-stately/useColorFieldState`, needs `locale`) | Same return as `useNumberField` | Same page |
| `useColorSlider(opts, state)` (from `useColorSlider`) | `useColorSliderState` (needs `locale`) | `labelProps`, `trackProps` on the track with `trackRef`, `thumbProps`, `inputProps` with `inputRef`, `outputProps` | `ColorSlider/useColorSlider` |
| `useColorSwatch(props)` (from `useColorSwatch`) | None | `colorSwatchProps` on the swatch, `color` | `ColorSwatch/useColorSwatch` |
| `useColorWheel(opts, state, inputRef)` (from `useColorWheel`) | `useColorWheelState` | `trackProps`, `thumbProps`, `inputProps` | `ColorWheel/useColorWheel` |

The `Select`, `ComboBox`, `Menu`, `Table`, `Tabs`, `Slider`, `Calendar`, `RangeCalendar`, `DateField`, `TimeField`, `DatePicker`, and `DateRangePicker` tables are in the worked sections above.

## Short examples

### Button, Link, ToggleButton

`useButton` accepts any element with `elementType`. For a non-button element it adds `role="button"` and `tabIndex`.

```tsx
import {useRef} from 'react';
import {useButton} from 'react-aria/useButton';
import {useLink} from 'react-aria/useLink';
import {useToggleButton} from 'react-aria/useToggleButton';
import {useToggleState} from 'react-stately/useToggleState';

function DivButton({children}: {children: React.ReactNode}) {
  let ref = useRef<HTMLDivElement>(null);
  let {buttonProps, isPressed} = useButton({elementType: 'div', onPress: () => {}}, ref);
  return <div {...buttonProps} ref={ref} data-pressed={isPressed || undefined}>{children}</div>;
}

function MyLink({href, children}: {href: string; children: React.ReactNode}) {
  let ref = useRef<HTMLAnchorElement>(null);
  let {linkProps} = useLink({href, elementType: 'a'}, ref);
  return <a {...linkProps} ref={ref}>{children}</a>;
}

function Pin() {
  let ref = useRef<HTMLButtonElement>(null);
  let state = useToggleState({defaultSelected: false});
  let {buttonProps, isSelected} = useToggleButton({}, state, ref);
  return <button {...buttonProps} ref={ref} data-selected={isSelected || undefined}>Pin</button>;
}
```

`useButton` props: `onPress` family, `isDisabled`, `elementType`, `type` (`'button'` default), `href`, `target`, `rel`, `preventFocusOnPress`, `excludeFromTabOrder`, `autoFocus`, form attributes, `aria-*`. Pass `isDisabled` to the hook. Do not set `disabled` on the DOM.

### Checkbox, Switch, Radio

The real `<input>` stays in the DOM inside `VisuallyHidden`. Style a separate visual from the flags, with focus from `useFocusRing` on the input.

```tsx
import {useRef} from 'react';
import {useFocusRing} from 'react-aria/useFocusRing';
import {mergeProps} from 'react-aria/mergeProps';
import {useCheckbox, type AriaCheckboxProps} from 'react-aria/useCheckbox';
import {VisuallyHidden} from 'react-aria/VisuallyHidden';
import {useToggleState} from 'react-stately/useToggleState';

function Checkbox(props: AriaCheckboxProps) {
  let state = useToggleState(props);
  let ref = useRef<HTMLInputElement>(null);
  let {labelProps, inputProps, isSelected, isDisabled} = useCheckbox(props, state, ref);
  let {focusProps, isFocusVisible} = useFocusRing();
  return (
    <label {...labelProps} data-disabled={isDisabled || undefined}>
      <VisuallyHidden>
        <input {...mergeProps(inputProps, focusProps)} ref={ref} />
      </VisuallyHidden>
      <span data-selected={isSelected || undefined} data-focus-visible={isFocusVisible || undefined} aria-hidden="true" />
      {props.children}
    </label>
  );
}
```

`isIndeterminate` is a visual state only. It does not change `isSelected`. For group patterns, pass the state down through a React context so each child can call `useCheckboxGroupItem` or `useRadio`:

```tsx
import {createContext, useContext, useRef} from 'react';
import {useRadio, useRadioGroup} from 'react-aria/useRadioGroup';
import {useRadioGroupState, type RadioGroupState} from 'react-stately/useRadioGroupState';

const RadioContext = createContext<RadioGroupState | null>(null);

function RadioGroup(props: any) {
  let state = useRadioGroupState(props);
  let {radioGroupProps, labelProps} = useRadioGroup(props, state);
  return (
    <div {...radioGroupProps}>
      <span {...labelProps}>{props.label}</span>
      <RadioContext.Provider value={state}>{props.children}</RadioContext.Provider>
    </div>
  );
}

function Radio(props: {value: string; children: React.ReactNode}) {
  let state = useContext(RadioContext)!;
  let ref = useRef<HTMLInputElement>(null);
  let {inputProps, labelProps} = useRadio(props, state, ref);
  return (
    <label {...labelProps}>
      <input {...inputProps} ref={ref} />
      {props.children}
    </label>
  );
}
```

Radio group state props: `value`, `defaultValue`, `onChange`, `name`, `orientation`, `isDisabled`, `isReadOnly`, `isRequired`, validation props. Checkbox group state props: `value`, `defaultValue`, `onChange` (`string[]`), `name`, same validation.

### TextField, SearchField, NumberField

```tsx
import {useRef} from 'react';
import {useLocale} from 'react-aria/I18nProvider';
import {useNumberField} from 'react-aria/useNumberField';
import {useSearchField} from 'react-aria/useSearchField';
import {useTextField} from 'react-aria/useTextField';
import {useNumberFieldState} from 'react-stately/useNumberFieldState';
import {useSearchFieldState} from 'react-stately/useSearchFieldState';

function TextArea(props: {label: string; description?: string}) {
  let ref = useRef<HTMLTextAreaElement>(null);
  let {labelProps, inputProps, descriptionProps} = useTextField({...props, inputElementType: 'textarea'}, ref);
  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <textarea {...inputProps} ref={ref} />
      {props.description && <div {...descriptionProps}>{props.description}</div>}
    </div>
  );
}

function SearchField(props: {label: string; onSubmit?: (v: string) => void}) {
  let state = useSearchFieldState(props);
  let ref = useRef<HTMLInputElement>(null);
  let {labelProps, inputProps, clearButtonProps} = useSearchField(props, state, ref);
  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <input {...inputProps} ref={ref} />
      {state.value !== '' && <Button {...clearButtonProps}>×</Button>}
    </div>
  );
}

function NumberField(props: {label: string; formatOptions?: Intl.NumberFormatOptions}) {
  let {locale} = useLocale();
  let state = useNumberFieldState({...props, locale});
  let ref = useRef<HTMLInputElement>(null);
  let {labelProps, groupProps, inputProps, incrementButtonProps, decrementButtonProps} = useNumberField(props, state, ref);
  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <div {...groupProps}>
        <Button {...decrementButtonProps}>-</Button>
        <input {...inputProps} ref={ref} />
        <Button {...incrementButtonProps}>+</Button>
      </div>
    </div>
  );
}
```

- TextField props: `value`, `defaultValue`, `onChange`, `inputElementType`, `type`, `name`, `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `placeholder`, `autoComplete`, `maxLength`, `minLength`, `pattern`.
- SearchField adds `onSubmit(value)`, `onClear()`. Escape clears, and Enter submits.
- NumberField props: `value`, `defaultValue`, `onChange`, `minValue`, `maxValue`, `step`, `formatOptions`, `commitBehavior` (`'snap'` or `'validate'`), `isWheelDisabled`, `incrementAriaLabel`, `decrementAriaLabel`. `onChange` fires on commit (blur or stepper), not on each key.

### ToggleButtonGroup, Toolbar, Separator

```tsx
import {useRef} from 'react';
import {useSeparator} from 'react-aria/useSeparator';
import {useToggleButtonGroup, useToggleButtonGroupItem} from 'react-aria/useToggleButtonGroup';
import {useToolbar} from 'react-aria/useToolbar';
import {useToggleGroupState, type ToggleGroupState} from 'react-stately/useToggleGroupState';

function Group({children}: {children: (state: ToggleGroupState) => React.ReactNode}) {
  let ref = useRef<HTMLDivElement>(null);
  let props = {selectionMode: 'single' as const, 'aria-label': 'Align'};
  let state = useToggleGroupState(props);
  let {groupProps} = useToggleButtonGroup(props, state, ref);
  return <div {...groupProps} ref={ref}>{children(state)}</div>;
}

function GroupItem({id, state, children}: {id: string; state: ToggleGroupState; children: React.ReactNode}) {
  let ref = useRef<HTMLButtonElement>(null);
  let {buttonProps, isSelected} = useToggleButtonGroupItem({id}, state, ref);
  return <button {...buttonProps} ref={ref} data-selected={isSelected || undefined}>{children}</button>;
}

function Toolbar({children}: {children: React.ReactNode}) {
  let ref = useRef<HTMLDivElement>(null);
  let {toolbarProps} = useToolbar({'aria-label': 'Edit', orientation: 'horizontal'}, ref);
  let {separatorProps} = useSeparator({orientation: 'vertical'});
  return (
    <div {...toolbarProps} ref={ref}>
      {children}
      <div {...separatorProps} />
    </div>
  );
}
```

`useToolbar` uses arrow keys between children and one Tab stop. `useSeparator` with `elementType: 'hr'` adds no role, since `hr` has it. Use `elementType: 'li'` inside lists.

### Meter, ProgressBar

```tsx
import {useMeter} from 'react-aria/useMeter';
import {useProgressBar} from 'react-aria/useProgressBar';

function Meter(props: {label: string; value: number}) {
  let {meterProps, labelProps} = useMeter(props);
  return (
    <div {...meterProps}>
      <span {...labelProps}>{props.label}</span>
      <div style={{width: `${props.value}%`}} />
    </div>
  );
}

function Progress(props: {label: string; value?: number; isIndeterminate?: boolean}) {
  let {progressBarProps, labelProps} = useProgressBar(props);
  return (
    <div {...progressBarProps}>
      <span {...labelProps}>{props.label}</span>
      {!props.isIndeterminate && <div style={{width: `${props.value}%`}} />}
    </div>
  );
}
```

Props: `value`, `minValue` (0), `maxValue` (100), `formatOptions`, `valueLabel`, `label`. ProgressBar adds `isIndeterminate`. Neither hook computes the fill: compute it yourself.

### Disclosure

```tsx
import {useRef} from 'react';
import {useButton} from 'react-aria/useButton';
import {useDisclosure} from 'react-aria/useDisclosure';
import {useDisclosureState} from 'react-stately/useDisclosureState';

function Disclosure(props: {title: string; children: React.ReactNode}) {
  let state = useDisclosureState({});
  let panelRef = useRef<HTMLDivElement>(null);
  let triggerRef = useRef<HTMLButtonElement>(null);
  let {buttonProps, panelProps} = useDisclosure({}, state, panelRef);
  let {buttonProps: triggerProps} = useButton(buttonProps, triggerRef);
  return (
    <div>
      <h3>
        <button {...triggerProps} ref={triggerRef}>{props.title}</button>
      </h3>
      <div {...panelProps} ref={panelRef}>{props.children}</div>
    </div>
  );
}
```

Props: `isExpanded`, `defaultExpanded`, `onExpandedChange`, `isDisabled`. Keep the panel mounted: the hook sets `hidden="until-found"` so browser find-in-page can open it, and it waits for running exit animations before hiding.

### GridList, TagGroup

```tsx
import {useRef} from 'react';
import {useGridList, useGridListItem} from 'react-aria/useGridList';
import {useTag, useTagGroup} from 'react-aria/useTagGroup';
import {useListState} from 'react-stately/useListState';

function GridList(props: any) {
  let state = useListState(props);
  let ref = useRef<HTMLUListElement>(null);
  let {gridProps} = useGridList(props, state, ref);
  return (
    <ul {...gridProps} ref={ref}>
      {[...state.collection].map(item => <GridItem key={item.key} item={item} state={state} />)}
    </ul>
  );
}

function GridItem({item, state}: any) {
  let ref = useRef<HTMLLIElement>(null);
  let {rowProps, gridCellProps, isSelected} = useGridListItem({node: item}, state, ref);
  return (
    <li {...rowProps} ref={ref} data-selected={isSelected || undefined}>
      <div {...gridCellProps}>{item.rendered}</div>
    </li>
  );
}

function TagGroup(props: any) {
  let state = useListState(props);
  let ref = useRef<HTMLDivElement>(null);
  let {gridProps, labelProps} = useTagGroup(props, state, ref);
  return (
    <div>
      <span {...labelProps}>{props.label}</span>
      <div {...gridProps} ref={ref}>
        {[...state.collection].map(item => <Tag key={item.key} item={item} state={state} />)}
      </div>
    </div>
  );
}

function Tag({item, state}: any) {
  let ref = useRef<HTMLDivElement>(null);
  let {rowProps, gridCellProps, removeButtonProps, allowsRemoving} = useTag({item}, state, ref);
  return (
    <div {...rowProps} ref={ref}>
      <div {...gridCellProps}>
        {item.rendered}
        {allowsRemoving && <Button {...removeButtonProps}>×</Button>}
      </div>
    </div>
  );
}
```

GridList props: `onAction`, `selectionMode`, `selectionBehavior`, `selectedKeys`, `defaultSelectedKeys`, `onSelectionChange`, `disabledKeys`, `disabledBehavior`, `keyboardNavigationBehavior` (`'arrow'`, `'tab'`), `escapeKeyBehavior`, `linkBehavior`, `isVirtualized`, `shouldFocusWrap`, `shouldSelectOnPressUp`. TagGroup adds `onRemove(keys)`, `label`, `description`, `errorMessage`. `allowsRemoving` is true when `onRemove` is set. Pass the `onRemove` to `useTagGroup`.

### Modal

```tsx
import {useRef, type ReactNode} from 'react';
import {Overlay} from 'react-aria/Overlay';
import {useModalOverlay, type AriaModalOverlayProps} from 'react-aria/useModalOverlay';
import {useOverlayTrigger} from 'react-aria/useOverlayTrigger';
import {useOverlayTriggerState, type OverlayTriggerState} from 'react-stately/useOverlayTriggerState';

function Modal({state, children, ...props}: AriaModalOverlayProps & {state: OverlayTriggerState; children: ReactNode}) {
  let ref = useRef<HTMLDivElement>(null);
  let {modalProps, underlayProps} = useModalOverlay(props, state, ref);
  return (
    <Overlay>
      <div {...underlayProps} style={{position: 'fixed', inset: 0, display: 'grid', placeItems: 'center'}}>
        <div {...modalProps} ref={ref}>{children}</div>
      </div>
    </Overlay>
  );
}

function ModalTrigger() {
  let state = useOverlayTriggerState({});
  let {triggerProps, overlayProps} = useOverlayTrigger({type: 'dialog'}, state);
  return (
    <>
      <Button {...triggerProps}>Open</Button>
      {state.isOpen && (
        <Modal state={state} isDismissable>
          <Dialog {...overlayProps} title="Enter your name">
            <Button onPress={state.close}>Close</Button>
          </Dialog>
        </Modal>
      )}
    </>
  );
}
```

Props: `isDismissable`, `isKeyboardDismissDisabled`, `shouldCloseOnInteractOutside`, `isEntering` (with an entry animation).

Focus containment must be turned on from a component **inside** `Overlay`. `useDialog` does this. If the content has no dialog, make sure the hook that enables it runs inside. `useModalOverlay` hides the outside from screen readers and locks scroll.

`usePopover` props: `triggerRef`, `popoverRef` (required), `arrowRef`, `groupRef`, `isNonModal`, `isKeyboardDismissDisabled`, `shouldCloseOnInteractOutside`, `placement`, `offset`, `crossOffset`, `containerPadding`, `shouldFlip`, `arrowSize`, `boundaryElement`, `scrollRef`, `shouldUpdatePosition`, `maxHeight`, `arrowBoundaryOffset`, `getTargetRect`.

### Tooltip

```tsx
import {useRef, type ReactNode} from 'react';
import {mergeProps} from 'react-aria/mergeProps';
import {useTooltip, useTooltipTrigger} from 'react-aria/useTooltipTrigger';
import {useTooltipTriggerState, type TooltipTriggerProps} from 'react-stately/useTooltipTriggerState';

function TooltipButton(props: TooltipTriggerProps & {tooltip: ReactNode; children: ReactNode}) {
  let state = useTooltipTriggerState(props);
  let ref = useRef<HTMLButtonElement>(null);
  let {triggerProps, tooltipProps} = useTooltipTrigger(props, state, ref);
  let {tooltipProps: finalProps} = useTooltip(tooltipProps, state);
  return (
    <>
      <button ref={ref} {...triggerProps}>{props.children}</button>
      {state.isOpen && (
        <span {...mergeProps(tooltipProps, finalProps)} style={{position: 'absolute'}}>{props.tooltip}</span>
      )}
    </>
  );
}
```

State props: `delay` (1500), `closeDelay`, `trigger` (`'focus'` for focus only; both by default), `isDisabled`, `isOpen`, `defaultOpen`, `onOpenChange`, `shouldCloseOnPress` (true). A tooltip must not hold interactive content, and it does not appear on touch. Position it yourself with `useOverlayPosition`.

### Toast

```tsx
import {useRef} from 'react';
import {useToast, useToastRegion} from 'react-aria/useToast';
import {ToastQueue, useToastQueue, useToastState, type QueuedToast, type ToastState} from 'react-stately/useToastState';

const queue = new ToastQueue<string>({maxVisibleToasts: 5});

function GlobalToasts() {
  let state = useToastQueue(queue);
  return state.visibleToasts.length > 0 ? <ToastRegion state={state} /> : null;
}

function LocalToasts() {
  let state = useToastState<string>({maxVisibleToasts: 5});
  return <button onClick={() => state.add('Saved', {timeout: 5000})}>Save</button>;
}

function ToastRegion({state}: {state: ToastState<string>}) {
  let ref = useRef<HTMLDivElement>(null);
  let {regionProps} = useToastRegion({'aria-label': 'Notifications'}, state, ref);
  return (
    <div {...regionProps} ref={ref}>
      {state.visibleToasts.map(toast => <Toast key={toast.key} toast={toast} state={state} />)}
    </div>
  );
}

function Toast({toast, state}: {toast: QueuedToast<string>; state: ToastState<string>}) {
  let ref = useRef<HTMLDivElement>(null);
  let {toastProps, contentProps, titleProps, closeButtonProps} = useToast({toast}, state, ref);
  return (
    <div {...toastProps} ref={ref}>
      <div {...contentProps}>
        <div {...titleProps}>{toast.content}</div>
      </div>
      <Button {...closeButtonProps}>×</Button>
    </div>
  );
}
```

`state.add(content, {timeout, onClose})` returns the key. `state.close(key)`, `pauseAll()`, `resumeAll()`. A toast with no `timeout` stays until closed. The region pauses timers on hover and focus and registers as an F6 landmark.

### Color

```tsx
import {useRef} from 'react';
import {useLocale} from 'react-aria/I18nProvider';
import {useColorArea} from 'react-aria/useColorArea';
import {useColorField} from 'react-aria/useColorField';
import {useColorSlider} from 'react-aria/useColorSlider';
import {useColorSwatch} from 'react-aria/useColorSwatch';
import {useColorWheel} from 'react-aria/useColorWheel';
import {useColorAreaState} from 'react-stately/useColorAreaState';
import {useColorFieldState} from 'react-stately/useColorFieldState';
import {useColorSliderState} from 'react-stately/useColorSliderState';
import {useColorWheelState} from 'react-stately/useColorWheelState';

function ColorArea(props: any) {
  let inputXRef = useRef<HTMLInputElement>(null);
  let inputYRef = useRef<HTMLInputElement>(null);
  let containerRef = useRef<HTMLDivElement>(null);
  let state = useColorAreaState(props);
  let {colorAreaProps, thumbProps, xInputProps, yInputProps} = useColorArea(
    {...props, inputXRef, inputYRef, containerRef},
    state
  );
  return (
    <div {...colorAreaProps} ref={containerRef} style={{...colorAreaProps.style, width: 192, height: 192}}>
      <div {...thumbProps}>
        <input {...xInputProps} ref={inputXRef} />
        <input {...yInputProps} ref={inputYRef} />
      </div>
    </div>
  );
}

function ColorSlider(props: any) {
  let {locale} = useLocale();
  let state = useColorSliderState({...props, locale});
  let trackRef = useRef<HTMLDivElement>(null);
  let inputRef = useRef<HTMLInputElement>(null);
  let {labelProps, trackProps, thumbProps, inputProps, outputProps} = useColorSlider({...props, trackRef, inputRef}, state);
  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <output {...outputProps}>{state.value.formatChannelValue(props.channel, locale)}</output>
      <div {...trackProps} ref={trackRef} style={{...trackProps.style, height: 28}}>
        <div {...thumbProps}>
          <input {...inputProps} ref={inputRef} />
        </div>
      </div>
    </div>
  );
}

function ColorWheel(props: any) {
  let inputRef = useRef<HTMLInputElement>(null);
  let state = useColorWheelState(props);
  let {trackProps, thumbProps, inputProps} = useColorWheel({...props, outerRadius: 100, innerRadius: 74}, state, inputRef);
  return (
    <div style={{position: 'relative', width: 200, height: 200}}>
      <div {...trackProps} />
      <div {...thumbProps}>
        <input {...inputProps} ref={inputRef} />
      </div>
    </div>
  );
}

function ColorField(props: any) {
  let state = useColorFieldState(props);
  let ref = useRef<HTMLInputElement>(null);
  let {labelProps, inputProps} = useColorField(props, state, ref);
  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <input {...inputProps} ref={ref} />
    </div>
  );
}

function ColorSwatch(props: {color: string}) {
  let {colorSwatchProps, color} = useColorSwatch(props);
  return <div {...colorSwatchProps} data-color={color.toString('hexa')} style={{...colorSwatchProps.style, width: 32, height: 32}} />;
}
```

- The hooks supply the gradient and position in `style` and visually hide the inputs. Merge your style after theirs. Set the size yourself.
- `useColorSwatch` needs `colorName` only to override the generated description. Set `aria-label` to give context.
- Value types: string or `Color` from `parseColor` in `react-stately/Color`. `onChange` gives `Color`.
- Area props: `xChannel`, `yChannel`, `colorSpace`, `onChangeEnd`, `xName`, `yName`, `form`, `isDisabled`. Slider props: `channel` (required), `colorSpace`, `orientation`, `onChangeEnd`, `name`. Wheel props: `onChangeEnd`, `isDisabled`, and required `outerRadius`, `innerRadius`.
- `useColorSlider` uses `aria-label` when there is no label: it needs one or the other.

## react-stately export inventory

Import form: `react-stately/<subpath>`. Types are in `react-stately/dist/types/exports`. The package root also exports almost everything, except `useControlledState`.

### State for patterns

| Subpath | Exports | What it does |
| --- | --- | --- |
| `useCalendarState` | `useCalendarState` | Focused date, visible range, and selected date(s). Needs `locale`, `createCalendar`. |
| `useRangeCalendarState` | `useRangeCalendarState` | Same for a range, plus anchor, highlight, drag. |
| `useCheckboxGroupState` | `useCheckboxGroupState` | List of selected values. `isSelected`, `addValue`, `removeValue`, `toggleValue`. |
| `useColorAreaState` | `useColorAreaState` | Two-channel color value and thumb position. |
| `useColorFieldState` | `useColorFieldState`, `useColorChannelFieldState` | Hex text input, or one channel as a number field. |
| `useColorPickerState` | `useColorPickerState` | A shared color value for a picker. |
| `useColorSliderState` | `useColorSliderState` | One channel as slider state. Needs `locale`. |
| `useColorWheelState` | `useColorWheelState` | Hue value and thumb position on a circle. |
| `useComboBoxState` | `useComboBoxState` | List state, open state, input text, commit and revert. |
| `useDateFieldState` | `useDateFieldState` | Editable date segments. Needs `locale`, `createCalendar`. |
| `useTimeFieldState` | `useTimeFieldState` | Editable time segments. Needs `locale`. |
| `useDatePickerState` | `useDatePickerState` | Date and time value, plus popover open state. |
| `useDateRangePickerState` | `useDateRangePickerState` | Range value, plus popover open state. |
| `useDisclosureState` | `useDisclosureState` | `isExpanded`, `expand`, `collapse`, `toggle`. |
| `useDisclosureGroupState` | `useDisclosureGroupState` | Expanded keys for an accordion. |
| `useListState` | `useListState`, `UNSTABLE_useFilteredListState` | Collection plus `selectionManager`. Used by ListBox, GridList, TagGroup. |
| `useSingleSelectListState` | `useSingleSelectListState` | List state with one selected key. |
| `useMenuTriggerState` | `useMenuTriggerState`, `useSubmenuTriggerState` | Open state with focus strategy, and the submenu stack. |
| `useMultipleSelectionState` | `useMultipleSelectionState` | Raw selected keys, focused key, selection mode. Under list and table state. |
| `useNumberFieldState` | `useNumberFieldState` | Parse and format input text, step, commit. Needs `locale`. |
| `useOverlayTriggerState` | `useOverlayTriggerState` | `isOpen`, `open`, `close`, `toggle`, `setOpen`. |
| `useRadioGroupState` | `useRadioGroupState` | Selected value, last focused value. |
| `useSearchFieldState` | `useSearchFieldState` | `value`, `setValue`. |
| `useSelectState` | `useSelectState` | List state plus open state, plus `value`. |
| `useSliderState` | `useSliderState` | Thumb values, percents, labels, drag. Needs `numberFormatter`. |
| `useTabListState` | `useTabListState` | Single selected tab. Selects a valid tab automatically. |
| `useTableState` | `useTableState`, `UNSTABLE_useFilteredTableState`, `useTableColumnResizeState`, `TableHeader`, `TableBody`, `Column`, `Row`, `Cell` | Grid collection, sort, selection, expand, and resize. |
| `useToastState` | `useToastState`, `useToastQueue`, `ToastQueue` | Local or global queue of toasts. |
| `useToggleState` | `useToggleState` | `isSelected`, `setSelected`, `toggle`. |
| `useToggleGroupState` | `useToggleGroupState` | Selected keys for a toggle button group. |
| `useTokenFieldState` | `useTokenFieldState`, `TokenFieldValue` | Mixed text and token value. |
| `useTooltipTriggerState` | `useTooltipTriggerState` | Open state with global warm-up and cool-down delays. |
| `useTreeState` | `useTreeState` | Collection, expanded keys, and selection. Used by Menu. |

### Data

| Subpath | Exports | What it does |
| --- | --- | --- |
| `useListData` | `useListData` | Client list with selection, filter, and `append`, `remove`, `update`, `move`. |
| `useAsyncList` | `useAsyncList` | Async `load` and `sort`, paging through a cursor, loading state, abort signal. |
| `useTreeData` | `useTreeData` | Client tree with `insert`, `remove`, `move`, `update`. |

These three work with components and hooks. They do not depend on a pattern.

### Drag and drop

| Subpath | Exports | What it does |
| --- | --- | --- |
| `useDraggableCollectionState` | `useDraggableCollectionState` | Tracks dragged keys in a collection. |
| `useDroppableCollectionState` | `useDroppableCollectionState` | Tracks the current drop target in a collection. |

### Collections

| Subpath | Exports | What it does |
| --- | --- | --- |
| `Item` | `Item` | Static or dynamic item element. It renders nothing. State hooks read its props. |
| `Section` | `Section` | Group of items with `title`. Same mechanism. |
| Root only | `useCollection` | Builds a collection from `Item` and `Section` children with a factory. Also `react-stately/private/collections/useCollection`. |
| `private/collections/CollectionBuilder` | `CollectionBuilder` | The `Item`-based builder class. Private. Do not confuse it with `CollectionBuilder` in `react-aria/CollectionBuilder`. |
| `private/collections/getChildNodes` | `getChildNodes`, `getFirstItem`, `getLastItem`, `getNthItem`, `compareNodeOrder` | Node helpers. Private. |
| `private/collections/getItemCount` | `getItemCount` | Counts items through sections. Private. |
| `private/list/ListCollection` | `ListCollection` | Collection factory for a list. Private. |
| `private/selection/SelectionManager` | `SelectionManager` | Class behind `state.selectionManager`. Private path. Use the instance. |
| `private/table/TableCollection` | `TableCollection`, `buildHeaderRows` | Table collection class. Private. |
| `private/table/TableColumnLayout` | `TableColumnLayout` | Column width logic. Private. |
| `private/table/useTreeGridState` | `UNSTABLE_useTreeGridState` | Tree-grid state. Private and unstable. |

`private/*` paths resolve but they are internal, with no stability promise. Prefer the public exports.

The public builder for component-style collections is in `react-aria/CollectionBuilder` and `react-aria-components/CollectionBuilder`: `CollectionBuilder`, `createLeafComponent`, `createBranchComponent`. `Collection` is in `react-aria/Collection` and `react-aria-components/Collection`.

### Virtualizer

| Subpath | Exports | What it does |
| --- | --- | --- |
| `useVirtualizerState` | `useVirtualizerState`, `Layout`, `LayoutInfo`, `Point`, `Rect`, `ReusableView`, `Size`, `GridLayout`, `ListLayout`, `TableLayout`, `WaterfallLayout` | Visible views and layout classes for virtualized collections. |

### Other

| Subpath | Exports | What it does |
| --- | --- | --- |
| `useControlledState` | `useControlledState` | The `value`, `defaultValue`, `onChange` state pattern. **Subpath only: not in the root.** |
| `Color` | `parseColor`, `getColorChannels` | Parse a color string into a `Color` object. List the channels of a color space. |
| Root only | `FormValidationContext` | Server errors for a form, by field name. |

```tsx
import {useControlledState} from 'react-stately/useControlledState';

function Toggle(props: {value?: boolean; defaultValue?: boolean; onChange?: (v: boolean) => void}) {
  let [value, setValue] = useControlledState(props.value, props.defaultValue ?? false, props.onChange);
  return <button onClick={() => setValue(!value)}>{String(value)}</button>;
}
```

`useControlledState` calls `onChange` only when the value changes, and warns if a component moves between controlled and uncontrolled.
