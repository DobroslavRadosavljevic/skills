# Extension: TanStack Form + schemas

Load when forms use TanStack Form with Standard Schema / Effect Schema / Zod validators.

## Stance

**Form schemas model UX**, not API response DTOs. Shared forms live in `modules/<feature>/schema`. Page-only search/form schemas may sit under the route as `-schema/`.

## Tree

```text
modules/<feature>/schema/
  <form>.ts                  # Effect Schema / Zod → Standard Schema

routes/<area>/…/
  -schema/<search>.ts        # validateSearch only for this route
  -components/<form>.tsx     # useForm + design-system fields
```

## MUST

1. Put reusable form contracts in **module `schema/`**.
2. Use route **`-schema/`** for `validateSearch` / strip defaults when only that route needs them.
3. Do not invent parallel **API response** types next to forms — use generated API types for server data.
4. Keep submit handlers calling module hooks (auth / generated mutations), not raw clients in the JSX tree when hooks exist.

## Soft defaults

- Effect Schema + Standard Schema adapter for TanStack Form.
- Search schemas export defaults + strip empty params helpers beside the schema.

## MUST NOT

1. Duplicating the same sign-in schema in three route folders — promote to `modules/authentication/schema`.
2. Using form schemas as substitutes for OpenAPI response typing.

## Checklist

```text
TanStack Form overlay:
- [ ] Shared schemas in modules/<feature>/schema
- [ ] Route-only search schemas in -schema/
- [ ] Forms use Standard Schema + useForm
- [ ] Submit via existing hooks/mutations
```
