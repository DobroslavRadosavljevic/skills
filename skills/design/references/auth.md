# Auth (login, signup, invite, password)

**Job:** Signup = create identity with minimum friction. Login = speed +
recovery. Invite/reset = complete a token with trust. Do **not** mix onboarding
questions into signup.

Blocks: https://ui.shadcn.com/blocks/login

## Density and type

`min-h-svh` centered. Form `max-w-sm`. Optional `lg:grid-cols-2` with a muted
cover (`login-02`). Title `text-2xl font-semibold`. Fields `text-sm`. Helper
`text-muted-foreground` (contrast-check).

## Color and CTA

`bg-background` or `bg-muted` behind a `Card`. **One** filled submit. Social /
SSO = `outline`. Errors: `text-destructive` + copy + `Alert` — never color only.
Allow paste on passwords and OTP (WCAG 3.3.8).

## Layout

```text
Logo
Title + one-line subhead
SSO buttons
Separator “or”
Email / password (visible Label)
Primary Button
Text links (login↔signup, forgot)
```

Invite: who invited + workspace name. Reset: email → “check inbox” + resend.
**No** app `Sidebar`.

## Anti-patterns

- Company / role / phone on first signup
- Password rules only after failure
- Clearing fields on error
- Captcha by default
- Credit-card surprise
- Dumping new users on an empty dashboard with no next step

## Example

```tsx
<main className="flex min-h-svh items-center justify-center bg-muted px-4">
  <Card className="w-full max-w-sm">
    <CardHeader>
      <CardTitle className="text-2xl">Sign in</CardTitle>
      <CardDescription>Work email and password.</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" />
      </div>
      <Button className="w-full">Sign in</Button>
    </CardContent>
  </Card>
</main>
```
