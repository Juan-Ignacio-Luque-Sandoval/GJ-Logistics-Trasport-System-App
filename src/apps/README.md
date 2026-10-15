# Prototypes

One folder per app, named by its id in `src/ecosystem/registry.ts`:

```
src/apps/example-app/index.tsx     default export: a component taking PrototypeProps
```

Nothing else is needed: the shell finds `index.tsx` with `import.meta.glob`, loads it lazily at
`#/apps/<id>/…` and shows a "not mounted yet" page for ids with no folder. See `types.ts` for the
props.
