# Date and time components

Package: `react-aria-components` 1.22.1 with `@internationalized/date` 3.12.4. Docs: `https://react-aria.adobe.com/<Page>` (add `.md` for Markdown). Date objects and helpers are covered in [internationalized.md](internationalized.md).

Contents:

- [Which component to pick](#which-component-to-pick)
- [Value types and granularity](#value-types-and-granularity)
- [Shared date field parts](#shared-date-field-parts): DateInput, DateSegment
- [DateField](#datefield)
- [TimeField](#timefield)
- [Calendar](#calendar): selection, multiple months, focused date, month and year pickers, custom systems
- [RangeCalendar](#rangecalendar)
- [Calendar parts](#calendar-parts)
- [DatePicker](#datepicker)
- [DateRangePicker](#daterangepicker)
- [Locale, calendars, and RTL](#locale-calendars-and-rtl)
- [Common mistakes](#common-mistakes)

## Which component to pick

| Need | Component |
| --- | --- |
| User knows the date (birthday, passport expiry). Typing is faster than browsing. | `DateField` |
| Time only | `TimeField` |
| Browse dates, see availability, inline on the page | `Calendar` (one date, or several with `selectionMode="multiple"`) |
| Browse a date range, inline | `RangeCalendar` |
| Type or browse, in little space | `DatePicker` |
| Type or browse a range | `DateRangePicker` |

Fields do not accept free text. Each unit is a focusable segment, so the user never has to know the format or separators. Up and down arrows change a segment, Page Up and Page Down change it by larger steps, and typing a number moves focus to the next segment. Phones show a numeric keyboard.

## Value types and granularity

Values are objects from `@internationalized/date`, never JS `Date` or strings. Install it: `bun add @internationalized/date`. Each component accepts only some types:

| Type | Holds | Parse with | Accepted by |
| --- | --- | --- | --- |
| `CalendarDate` | date | `parseDate('2025-02-03')`, `today(tz)` | all date components |
| `CalendarDateTime` | date and time, no zone | `parseDateTime('2025-02-03T08:45')` | all date and time components |
| `ZonedDateTime` | date, time, zone | `parseZonedDateTime('2025-02-03T08:45[America/Los_Angeles]')`, `now(tz)` | all date and time components |
| `Time` | time | `parseTime('08:45')`, `new Time(8, 45)` | `TimeField` only |

`type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime`. `type TimeValue = Time | CalendarDateTime | ZonedDateTime`.

`Calendar` and `RangeCalendar` always work in days. `CalendarDate` is the natural value. Other types are accepted because of the shared `DateValue` type, and `onChange` keeps your input type.

`granularity` is the smallest unit shown: `'day' | 'hour' | 'minute' | 'second'` on date fields and pickers, `'hour' | 'minute' | 'second'` on `TimeField`.

- The default is `'day'` for a `CalendarDate` value, and `'minute'` for values with a time.
- The value must hold that unit. `granularity="minute"` with a `CalendarDate` throws `Invalid granularity`. Use `CalendarDateTime` or `ZonedDateTime`.
- With no value, the result type follows `placeholderValue`. Without one, `'day'` gives a `CalendarDate` and a time granularity gives a `CalendarDateTime`. To get a `ZonedDateTime` from an empty field, pass a zoned `placeholderValue`.
- `onChange` returns the same type as `value`. Fields call it with `null` when the user clears them.

Shared constraints:

- `minValue`, `maxValue`: `DateValue | null` (`TimeValue` on `TimeField`). In fields, an out-of-range value makes the field invalid. In calendars, those days are disabled.
- `isDateUnavailable(date) => boolean`: on all but `TimeField`. In a calendar, the day stays focusable but cannot be selected. In a field or picker, entering that date makes it invalid.
- Time zones: only a `ZonedDateTime` value shows a zone segment. `hideTimeZone` hides the abbreviation. See `internationalized.md` for zone conversion and daylight saving rules.
- `today(getLocalTimeZone())` is the usual `minValue`.

Forms: `name` submits the value as an ISO 8601 string. The server sees `2025-02-03`, `2025-02-03T08:45:00`, or a zoned string with offset and zone.

## Shared date field parts

```tsx
import {DateInput, DateSegment} from 'react-aria-components/DateField';

<DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
```

`DateInput` takes `children: (segment: DateSegment) => ReactElement`. It renders a `<div>` with class `react-aria-DateInput`. Data attributes: `data-hovered`, `data-focus-within`, `data-focus-visible`, `data-disabled`, `data-invalid`.

`DateSegment` takes `segment`. It renders a `<span>` with class `react-aria-DateSegment`. Data attributes: `data-hovered`, `data-focused`, `data-focus-visible`, `data-placeholder`, `data-readonly`, `data-disabled`, `data-invalid`, `data-type`.

Render props of `DateSegment`: `type`, `text`, `value`, `minValue`, `maxValue`, `isPlaceholder`, `placeholder`, plus the states above. `type` is `'era' | 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'dayPeriod' | 'literal' | 'timeZoneName'`.

Styling notes from the starter:

```css
.react-aria-DateInput { display: inline; white-space: nowrap; }
.react-aria-DateSegment { font-variant-numeric: tabular-nums; text-align: end; }
.react-aria-DateSegment[data-type='literal'] { padding: 0; }
.react-aria-DateSegment:focus { outline: none; caret-color: transparent; }
```

**Do not set `display: flex` on `DateInput`.** Segments rely on normal text flow and the browser's bidirectional algorithm. Flex breaks the segment order in right-to-left locales. Draw the focus ring from `[data-focus-within]` on `DateInput`.

## DateField

Types a date, or a date and time, in segments. Docs: https://react-aria.adobe.com/DateField

```tsx
import {useState} from 'react';
import {parseDate, type CalendarDate} from '@internationalized/date';
import {DateField, DateInput, DateSegment, FieldError, Label, Text} from 'react-aria-components/DateField';

function Appointment() {
  let [date, setDate] = useState<CalendarDate | null>(parseDate('2020-02-03'));
  return (
    <DateField name="date" isRequired value={date} onChange={setDate}>
      <Label>Appointment date</Label>
      <DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
      <Text slot="description">Pick a weekday.</Text>
      <FieldError />
    </DateField>
  );
}
```

Key props:

- Value: `value`, `defaultValue` (`T | null`), `onChange(value: T | null)`, `placeholderValue` (default today at midnight).
- Format: `granularity`, `hourCycle: 12 | 24`, `hideTimeZone`, `shouldForceLeadingZeros`.
- Rules: `minValue`, `maxValue`, `isDateUnavailable`.
- Validation: `isRequired`, `isInvalid`, `validate(value)`, `validationBehavior`, `name`, `form`.
- State: `isDisabled`, `isReadOnly`.

Styling: class `react-aria-DateField`. Data attributes: `data-invalid`, `data-disabled`, `data-readonly`, `data-required`. Render props add `state: DateFieldState`.

Format example:

```tsx
import {parseZonedDateTime} from '@internationalized/date';
import {DateField, DateInput, DateSegment, Label} from 'react-aria-components/DateField';

<DateField
  granularity="second"
  hourCycle={24}
  hideTimeZone
  shouldForceLeadingZeros
  defaultValue={parseZonedDateTime('2025-02-03T08:45:00[America/Los_Angeles]')}>
  <Label>Event time</Label>
  <DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
</DateField>
```

## TimeField

Types a time in segments. Docs: https://react-aria.adobe.com/TimeField

The docs prop table for this page lists design-system props (`label`, `description`, `errorMessage`, `size`). Those are not on this component. Use the parts below.

```tsx
import {Time} from '@internationalized/date';
import {DateInput, DateSegment, FieldError, Label, Text, TimeField} from 'react-aria-components/TimeField';

<TimeField
  name="time"
  isRequired
  minValue={new Time(9)}
  maxValue={new Time(17)}
  validate={time => (time?.minute % 15 !== 0 ? 'Appointments start every 15 minutes.' : null)}>
  <Label>Appointment time</Label>
  <DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
  <Text slot="description">Office hours only.</Text>
  <FieldError />
</TimeField>
```

Key props:

- Value: `value`, `defaultValue` (`Time`, `CalendarDateTime`, or `ZonedDateTime`, or `null`), `onChange`, `placeholderValue` (default 12:00 AM or 00:00 by hour cycle).
- Format: `granularity` (default `'minute'`), `hourCycle: 12 | 24`, `hideTimeZone`, `shouldForceLeadingZeros`.
- Rules: `minValue`, `maxValue`.
- Validation and state as in `DateField`.

Styling: class `react-aria-TimeField`. Same data attributes as `DateField`. Render props add `state`.

`CalendarDateTime` or `ZonedDateTime` values keep their date part while the user edits the time. A `ZonedDateTime` also shows the zone.

## Calendar

Browse and select one date, or several. Docs: https://react-aria.adobe.com/Calendar

```tsx
import {Button, Calendar, CalendarCell, CalendarGrid, CalendarHeading, Text} from 'react-aria-components/Calendar';

<Calendar aria-label="Appointment date" value={date} onChange={setDate}>
  <header>
    <Button slot="previous" aria-label="Previous">‹</Button>
    <CalendarHeading />
    <Button slot="next" aria-label="Next">›</Button>
  </header>
  <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
  <Text slot="errorMessage">Choose a weekday.</Text>
</Calendar>
```

`Calendar` has no `Label` part. Give it `aria-label` or `aria-labelledby`. `Button slot="previous"` and `slot="next"` get a localized label from context, so a label is optional on them. Pass one if you want to replace it.

Key props:

- Value: `value`, `defaultValue`, `onChange`, `selectionMode: 'single' | 'multiple'` (default `'single'`). In `'multiple'` mode, values are `readonly T[]`, and each picked cell has `data-selected`. The docs have no section on this mode; the types define it.
- Rules: `minValue`, `maxValue`, `isDateUnavailable(date)`, `isInvalid`, `isDisabled`, `isReadOnly`.
- Focus and paging: `focusedValue`, `defaultFocusedValue`, `onFocusChange(date: CalendarDate)`, `autoFocus`.
- Display: `visibleDuration: DateDuration` (default `{months: 1}`), `pageBehavior: 'visible' | 'single'` (default `'visible'`), `firstDayOfWeek: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'`, `weeksInMonth: number`, `selectionAlignment: 'start' | 'center' | 'end'` (default `'center'`).
- `createCalendar(identifier)`: supply a custom calendar system, or include only some calendars.

Styling: class `react-aria-Calendar`. Data attributes: `data-disabled`, `data-invalid`. Render props add `state: CalendarState`.

### Multiple selection

```tsx
import {parseDate} from '@internationalized/date';
import {Calendar, CalendarCell, CalendarGrid} from 'react-aria-components/Calendar';

<Calendar
  aria-label="Delivery days"
  selectionMode="multiple"
  defaultValue={[parseDate('2025-02-03'), parseDate('2025-02-05')]}>
  <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
</Calendar>
```

### Unavailable dates

```tsx
import {getLocalTimeZone, isWeekend, today} from '@internationalized/date';
import {Calendar, CalendarCell, CalendarGrid} from 'react-aria-components/Calendar';
import {useLocale} from 'react-aria-components/I18nProvider';

function Booking() {
  let {locale} = useLocale();
  let now = today(getLocalTimeZone());
  let blocked = [[now, now.add({days: 5})]];
  return (
    <Calendar
      aria-label="Appointment date"
      minValue={now}
      isDateUnavailable={date =>
        isWeekend(date, locale) ||
        blocked.some(([start, end]) => date.compare(start) >= 0 && date.compare(end) <= 0)
      }>
      <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
    </Calendar>
  );
}
```

Disabled cells (outside min/max) are not focusable. Unavailable cells stay focusable, so show them with a visual cue such as a strikethrough. Weekends differ by locale, so pass `locale` to `isWeekend`.

Custom rules: set `isInvalid` and render `<Text slot="errorMessage">`. Starter kits accept an `errorMessage` prop. The real component uses this slot.

### Multiple months

Set `visibleDuration` and render one grid per month with `offset`. Repeat the heading with the same `offset`.

```tsx
import {Button, Calendar, CalendarCell, CalendarGrid, CalendarHeading} from 'react-aria-components/Calendar';

const months = 3;

<Calendar aria-label="Dates" visibleDuration={{months}} pageBehavior="single">
  <div style={{display: 'flex', gap: 12}}>
    {Array.from({length: months}, (_, i) => (
      <div key={i}>
        <header>
          {i === 0 && <Button slot="previous">‹</Button>}
          <CalendarHeading offset={{months: i}} />
          {i === months - 1 && <Button slot="next">›</Button>}
        </header>
        <CalendarGrid offset={{months: i}}>{date => <CalendarCell date={date} />}</CalendarGrid>
      </div>
    ))}
  </div>
</Calendar>
```

- `pageBehavior="visible"` moves by the whole `visibleDuration`. `"single"` moves by one unit.
- `visibleDuration` may be other units, for example `{weeks: 1}` for a week view.
- `selectionAlignment` sets where the selection sits among visible months on first render.
- If a month grid has a fixed column width, let the months wrap or scroll on small screens. `visibleDuration` is not responsive by itself.

### Focused date

`focusedValue` sets which month is visible.

```tsx
import {useState} from 'react';
import {CalendarDate, getLocalTimeZone, today} from '@internationalized/date';
import {Button, Calendar, CalendarCell, CalendarGrid} from 'react-aria-components/Calendar';

function WithToday() {
  let [focused, setFocused] = useState(new CalendarDate(2021, 7, 1));
  return (
    <>
      <Button onPress={() => setFocused(today(getLocalTimeZone()))}>Today</Button>
      <Calendar aria-label="Date" focusedValue={focused} onFocusChange={setFocused}>
        <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
      </Calendar>
    </>
  );
}
```

### Month and year pickers

`CalendarMonthPicker` and `CalendarYearPicker` are headless. They call a render function with `{'aria-label', value, onChange, items}`. Each item is `{id: number, date: CalendarDate, formatted: string}`. Pass these to a `Select`. Use them in place of, or beside, `CalendarHeading`.

```tsx
import {Calendar, CalendarCell, CalendarGrid, CalendarMonthPicker, CalendarYearPicker} from 'react-aria-components/Calendar';
import type {CalendarMonthPickerAria, CalendarYearPickerAria} from 'react-aria-components/Calendar';
import {Button, ListBox, ListBoxItem, Popover, Select, SelectValue} from 'react-aria-components/Select';

function PickerSelect({items, ...props}: CalendarMonthPickerAria | CalendarYearPickerAria) {
  return (
    <Select {...props}>
      <Button><SelectValue /></Button>
      <Popover>
        <ListBox items={items as {id: number; formatted: string}[]}>
          {item => <ListBoxItem>{item.formatted}</ListBoxItem>}
        </ListBox>
      </Popover>
    </Select>
  );
}

<Calendar aria-label="Date">
  <header>
    <Button slot="previous">‹</Button>
    <CalendarMonthPicker format="short">{props => <PickerSelect {...props} />}</CalendarMonthPicker>
    <CalendarYearPicker visibleYears={20}>{props => <PickerSelect {...props} />}</CalendarYearPicker>
    <Button slot="next">›</Button>
  </header>
  <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
</Calendar>
```

- `CalendarMonthPicker`: `format: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'`.
- `CalendarYearPicker`: `visibleYears` (default 20), `format: {year?: 'numeric' | '2-digit', era?: 'long' | 'short' | 'narrow'}`.

### Custom calendar systems

`createCalendar` can return a subclass of a calendar class, for example a 4-5-4 fiscal calendar built on `GregorianCalendar`. Override `getDaysInMonth`, `fromJulianDay`, `toJulianDay`, `getFormattableMonth`, and `isEqual`. See `internationalized.md` for the `Calendar` interface.

```tsx
import {GregorianCalendar} from '@internationalized/date';
import {Calendar, CalendarCell, CalendarGrid} from 'react-aria-components/Calendar';

class FiscalCalendar extends GregorianCalendar {
  // Override the methods above.
}

<Calendar aria-label="Fiscal date" firstDayOfWeek="sun" createCalendar={() => new FiscalCalendar()}>
  <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
</Calendar>
```

## RangeCalendar

Browse and select a contiguous range. Docs: https://react-aria.adobe.com/RangeCalendar

```tsx
import {useState} from 'react';
import {parseDate} from '@internationalized/date';
import {Button, CalendarCell, CalendarGrid, CalendarHeading, RangeCalendar, Text} from 'react-aria-components/RangeCalendar';

function Trip() {
  let [range, setRange] = useState({start: parseDate('2025-02-03'), end: parseDate('2025-02-12')});
  return (
    <RangeCalendar aria-label="Trip dates" value={range} onChange={setRange}>
      <header>
        <Button slot="previous">‹</Button>
        <CalendarHeading />
        <Button slot="next">›</Button>
      </header>
      <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
      <Text slot="errorMessage">Maximum stay is one week.</Text>
    </RangeCalendar>
  );
}
```

All `Calendar` display and focus props apply, except `selectionMode`. Differences:

- `value`, `defaultValue`: `{start, end} | null`. `onChange` receives `{start, end}`.
- `isDateUnavailable(date, anchorDate: CalendarDate | null)`: `anchorDate` is the day where selection began. Use it for a maximum length: `anchorDate && Math.abs(date.compare(anchorDate)) > 7`.
- `allowsNonContiguousRanges`: allow a range that holds unavailable dates, for example time off that skips weekends.
- `commitBehavior: 'select' | 'clear' | 'reset'` (default `'select'`): what happens when a pointer is released outside or focus leaves mid-selection. `'select'` keeps the hovered range. `'clear'` clears. `'reset'` restores the previous range.

Styling: class `react-aria-RangeCalendar`. Data attributes: `data-disabled`, `data-invalid`. Render props add `state: RangeCalendarState` (`anchorDate`, `highlightedRange`, `isDragging`, `value`).

Range cell styling: use `data-selected` for the band, and `data-selection-start` and `data-selection-end` for the rounded ends. Draw the band on the cell and the rounded mark on an inner element, using a render function:

```tsx
import {CalendarCell} from 'react-aria-components/RangeCalendar';

<CalendarCell date={date}>
  {({formattedDate, isSelectionStart, isSelectionEnd}) => (
    <span className={isSelectionStart || isSelectionEnd ? 'mark' : undefined}>{formattedDate}</span>
  )}
</CalendarCell>
```

## Calendar parts

Full anatomy, for custom grids:

```tsx
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell
} from 'react-aria-components/Calendar';

<CalendarGrid weekdayStyle="short">
  <CalendarGridHeader>{day => <CalendarHeaderCell>{day}</CalendarHeaderCell>}</CalendarGridHeader>
  <CalendarGridBody>{date => <CalendarCell date={date} />}</CalendarGridBody>
</CalendarGrid>
```

| Part | Element | Class | Key props |
| --- | --- | --- | --- |
| `CalendarHeading` | heading | `react-aria-CalendarHeading` | `offset`, `format: {day, month, year, era}`, `level` |
| `CalendarGrid` | `<table>` | `react-aria-CalendarGrid` | `children` function or parts, `offset`, `weekdayStyle: 'narrow' | 'short' | 'long'` (default `'narrow'`) |
| `CalendarGridHeader` | `<thead>` | `react-aria-CalendarGridHeader` | `children(day: string)` |
| `CalendarHeaderCell` | `<th>` | `react-aria-CalendarHeaderCell` | `children` |
| `CalendarGridBody` | `<tbody>` | `react-aria-CalendarGridBody` | `children(date: CalendarDate)` |
| `CalendarCell` | `<td>` holding a `<div>` | `react-aria-CalendarCell` | `date`, `children`, hover events |

`CalendarCell` data attributes:

- `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`
- `data-selected`, `data-selection-start`, `data-selection-end`
- `data-disabled`: outside min/max. Not focusable.
- `data-unavailable`: from `isDateUnavailable`. Still focusable.
- `data-outside-month`: belongs to the next or previous month.
- `data-outside-visible-range`: outside the visible range.
- `data-invalid`, `data-today`

Render props add `date` and `formattedDate`. Cells from adjacent months render by default. Dim or hide them through `[data-outside-month]`.

Keyboard: arrow keys move between days and Enter selects. Home and End go to the start and end of the section. Page Up and Page Down move by one section (a month when months are shown), and Shift adds the next larger unit (a year). The component also renders a visually hidden next button after the dates, so touch screen reader users do not have to swipe back to the start.

Screen reader labels are built for you. Each cell's label has the localized date and weekday, plus selected, today, or unavailable. Range selection is announced in a live region.

## DatePicker

A `DateField` and a `Calendar` in a popover. Docs: https://react-aria.adobe.com/DatePicker

```tsx
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker,
  DateSegment,
  FieldError,
  Group,
  Label,
  Popover,
  Text
} from 'react-aria-components/DatePicker';
import {CalendarHeading} from 'react-aria-components/Calendar';

<DatePicker name="date" isRequired>
  <Label>Appointment date</Label>
  <Group>
    <DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
    <Button aria-label="Open calendar">▾</Button>
  </Group>
  <Text slot="description">Pick a weekday.</Text>
  <FieldError />
  <Popover>
    <Calendar>
      <header>
        <Button slot="previous">‹</Button>
        <CalendarHeading />
        <Button slot="next">›</Button>
      </header>
      <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
    </Calendar>
  </Popover>
</DatePicker>
```

`CalendarHeading` is not re-exported from the `DatePicker` subpath. Import it from `react-aria-components/Calendar`. No `Dialog` is needed: `Popover` gets `role="dialog"` by itself unless it is non-modal or already holds a dialog.

Key props:

- Value: `value`, `defaultValue`, `onChange`, `placeholderValue`.
- Overlay: `isOpen`, `defaultOpen`, `onOpenChange(isOpen)`, `shouldCloseOnSelect: boolean | (() => boolean)` (default `true`).
- Format: `granularity`, `hourCycle`, `hideTimeZone`, `shouldForceLeadingZeros`.
- Rules: `minValue`, `maxValue`, `isDateUnavailable`.
- Calendar: `firstDayOfWeek`, `pageBehavior`. These pass down to the calendar.
- Validation and state: `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `name`, `form`, `isDisabled`, `isReadOnly`.

Styling: class `react-aria-DatePicker`. Data attributes: `data-focus-within`, `data-focus-visible`, `data-disabled`, `data-readonly`, `data-invalid`, `data-required`, `data-open`. Render props add `state: DatePickerState`.

Behavior:

- With a time `granularity`, the calendar sets the date. The time is edited in the `DateInput`, or in a `TimeField` you place in the popover. Bind it through `DatePickerStateContext` (`state.timeValue`, `state.setTimeValue`).
- With a time granularity, once a date is picked, the value commits if a time is known or `shouldCloseOnSelect` is true. Otherwise the date waits for a time.
- Use a Group style for the shared border: `.react-aria-DatePicker .react-aria-Group { display: flex; }`, with `flex: 1; min-width: 0` on `DateInput`.

## DateRangePicker

Two date fields and a `RangeCalendar` in a popover. Docs: https://react-aria.adobe.com/DateRangePicker

The docs prop table for this page lists design-system props (`label`, `description`, `errorMessage`, `size`, `maxVisibleMonths`, `shouldFlip`). Those are not on this component.

```tsx
import {
  Button,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateRangePicker,
  DateSegment,
  FieldError,
  Group,
  Label,
  Popover,
  RangeCalendar,
  Text
} from 'react-aria-components/DateRangePicker';
import {CalendarHeading} from 'react-aria-components/RangeCalendar';

<DateRangePicker startName="startDate" endName="endDate" isRequired>
  <Label>Trip dates</Label>
  <Group>
    <DateInput slot="start">{segment => <DateSegment segment={segment} />}</DateInput>
    <span aria-hidden="true">–</span>
    <DateInput slot="end">{segment => <DateSegment segment={segment} />}</DateInput>
    <Button aria-label="Open calendar">▾</Button>
  </Group>
  <Text slot="description">Up to two weeks.</Text>
  <FieldError />
  <Popover>
    <RangeCalendar>
      <header>
        <Button slot="previous">‹</Button>
        <CalendarHeading />
        <Button slot="next">›</Button>
      </header>
      <CalendarGrid>{date => <CalendarCell date={date} />}</CalendarGrid>
    </RangeCalendar>
  </Popover>
</DateRangePicker>
```

Props: as `DatePicker`, and:

- `value`, `defaultValue`: `{start, end} | null`. `onChange({start, end} | null)`.
- `startName`, `endName`: form names. Each date submits on its own. There is no single `name`.
- `allowsNonContiguousRanges`, `commitBehavior`.
- `isDateUnavailable(date, anchorDate)`.

Styling: class `react-aria-DateRangePicker`, with the same data attributes as `DatePicker`. Render props add `state: DateRangePickerState`.

## Locale, calendars, and RTL

The locale sets calendar system, first day of week, weeks in month, weekend days, hour cycle, segment order, separators, and numerals.

Force a calendar or numbering system with Unicode locale extensions:

```tsx
import {I18nProvider} from 'react-aria-components/I18nProvider';

<I18nProvider locale="hi-IN-u-ca-indian">
  <MyDatePicker />
</I18nProvider>
```

- 13 calendar systems are built in, for example Gregorian, Buddhist, Islamic, Persian, Hebrew, Japanese.
- **`onChange` always returns the calendar of `value` or `defaultValue` (Gregorian if neither is set)**, whatever the user sees. Your app can store Gregorian dates while users work in another calendar.
- Do not assume Sunday starts the week or that weekends are Saturday and Sunday. Use `firstDayOfWeek` only for a true business rule. Use `isWeekend(date, locale)` and `startOfWeek(date, locale)`.
- `hourCycle` overrides the locale's 12 or 24 hour format.

Format selected values with `useDateFormatter`, which uses the current locale. It takes `Date` objects, so convert first. `formatRange` drops repeated parts: "Monday, May 9 to Friday, May 20, 2022".

```tsx
import {getLocalTimeZone, type CalendarDate} from '@internationalized/date';
import {useDateFormatter} from 'react-aria/useDateFormatter';

function Summary({date}: {date: CalendarDate}) {
  let formatter = useDateFormatter({dateStyle: 'full'});
  return <p>{formatter.format(date.toDate(getLocalTimeZone()))}</p>;
}
```

Right-to-left: since the March 2025 release, fields handle bidirectional order themselves.

- Time fields always read `HH:MM` left to right, in every locale.
- Date segment order follows the locale, for example `DD.MM.YYYY` in `he-IL`.
- Left and right arrows move to the visually adjacent segment, which may not be the next in the DOM.
- Your part: keep `DateInput` in flow layout (`display: inline`) and segments as spans. Do not reorder or flex them.

## Common mistakes

- Passing a JS `Date` or an ISO string as `value`. Parse it into a date object first.
- `granularity` with a time on a `CalendarDate`. It throws.
- Reading `onChange` as non-null in a field or picker. They send `null` when cleared.
- Missing `aria-label` on a standalone `Calendar` or `RangeCalendar`. Inside a picker, the label comes from the picker.
- Using `name` on `DateRangePicker`. It has `startName` and `endName`.
- Styling `isDateUnavailable` days as disabled. They can still take focus. Style `data-unavailable` differently from `data-disabled`.
- Rendering `Button` without `slot="previous"` or `slot="next"` in a calendar. It then has no paging behavior.
