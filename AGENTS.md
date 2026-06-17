always run `pnpm run check` to ensure code quality
always prefer absolute imports like `@/components/ui/Button`
you may not suppress eslint rules or typescript errors
functions must either be 100% pure, or be 100% side-effectful
if a function returns a value other than undefined, then it must be pure
if a function has side-effects, then it must only return undefined
functions, classes, modules, etc. must be prefixed with `_` if they are internal
private API.
Research dependencies and plan. Stop and propose prerequisites if the task requires major
groundwork, hacks, weakens correctness, or alters public APIs/specs. Do not silently
work around issues.
Keep files small and modular (split if too large). Make minimal, relevant refactors
before implementing the change. Write the least amount of readable code necessary,
make no unrelated changes, and prefer libraries over custom code.
Do not change code not relevant to the task, Respect the original codebase and code style.
Prefer shadcn components over custom components, install if missing.
