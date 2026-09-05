---
name: improve-prompt
description: Rewrite a user's rough request into a clear, specific, and actionable prompt without doing the requested work. Use only when the user explicitly invokes improve-prompt or asks to improve a prompt.
---

# Improve Prompt

Turn the user's rough request into a stronger prompt that another agent can act on.

## Output rules

- Return only the improved prompt in chat.
- Do not explain what you changed.
- Do not solve, implement, or review the task.
- Preserve the user's intent, constraints, and requested outcome.
- Add useful detail: context, scope, expected behavior, edge cases, quality criteria, and verification steps when they fit.
- Do not invent product requirements, technical choices, files, or constraints. If key information is missing, write a prompt that asks for it or states a sensible assumption.
- Match the length to the task. Make small requests only a little clearer. Make complex requests detailed enough to guide good work.
- Use direct language and concrete acceptance criteria.
- Keep the prompt easy to copy and paste. Do not wrap it in commentary or quotation marks.

## Detail level

Choose the smallest useful level:

- **Tiny change:** State the exact change and the main constraint.
- **Focused feature:** Include the target area, behavior, important states, and acceptance criteria.
- **Large or unclear task:** Include the goal, current context if provided, scope, constraints, decisions to resolve, edge cases, and validation.

When the user gives a vague request, improve its precision without turning it into a long project plan.

## Examples

Input:

```text
Make this hero section better
```

Output:

```text
Improve the hero section so its value proposition is clear within a few seconds. Strengthen the heading and supporting copy, make the primary call to action more prominent, improve visual hierarchy and spacing, and ensure the layout works well on mobile and desktop. Keep the existing brand style and avoid adding unrelated sections. Verify that the result is accessible and that the primary action remains easy to find at every viewport size.
```

Input:

```text
Make the button bigger
```

Output:

```text
Increase the button's size enough to improve readability and tap comfort without making it dominate the surrounding UI. Preserve its existing visual style, alignment, responsive behavior, and interaction states.
```

Input:

```text
Add user settings
```

Output:

```text
Add a user settings area where users can view and update their account preferences. Identify the existing account and navigation patterns first, then add the smallest consistent settings flow for the supported preferences. Include loading, success, validation, error, and unsaved-change states. Protect sensitive settings, preserve existing data, and add tests or other suitable checks for the update behavior.
```
