# Anti-slop

Reject generic “AI SaaS” looks. Brand lives in **tokens** (`--primary`, `--ring`,
`--radius`, fonts), not class soup.

## Ban

| Pattern | Do instead |
| --- | --- |
| Purple/pink mesh hero gradients | Flat `background` + one brand accent |
| Fake stats (“10k+ teams”, “99.9%”) | Real numbers or omit |
| Pill badge clusters (AI, Fast, Secure) | One badge or none |
| Equal-noise 3× feature cards | One primary story; others subordinate |
| Inter + indigo-500 everywhere | Brand font + brand OKLCH primary |
| Glass on every surface | Solid `card`; glass at most once if contrast holds |
| Nested cards, glow borders, rainbow accents | One radius, one accent |
| Icon rows with no labels | Named actions |
| Card grid in the marketing first viewport | Brand-first hero; full-bleed media if imagery leads |
| Pretty-ing a dense tool into a marketing layout | Keep dashboard density |

## Under-theming

If the UI still looks like every other shadcn demo, tokens are still default
zinc/neutral + Inter + equal cards. Change `--primary`, `--radius`, fonts, and
chart series. Do not add a second gray scale in utilities.

## Review fails

- More than one filled primary per view
- `text-foreground` on `bg-primary`
- Dark mode that is a photographic invert
- `text-xs text-muted-foreground` as the only help
- Missing empty/loading/error
- Focus ring removed or &lt; 3:1
