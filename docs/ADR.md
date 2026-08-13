# Architecture Decision Record (ADR)

A record of architecture decisions for `embed-images-in-markdown`, reconstructed from the full git log (`git log --all`, first commit `317d3de` through `81b71c7`). Two merge commits (`2c3a7dd`, `7d43450`) carry no independent changes and are referenced only where relevant to the commits they merge.

---

## ADR-001: Embed dropped images as base64 DataURLs via `DocumentDropEditProvider`

- **Status**: Accepted
- **Commits**: `317d3de` (first commit)
- **Context**: When an image is dragged into a Markdown file, the goal was to keep the Markdown document fully self-contained rather than copying the image next to the file and linking it by relative path.
- **Decision**: Register VS Code's `DocumentDropEditProvider` for the `markdown` language (`src/extension.ts`, `src/auto-import-on-drop-provider.ts`). On drop, the image is read and base64-encoded into a `data:image/<ext>;base64,...` URL. A reference-style link `![<filename>][<index>]` is inserted at the drop position, and the corresponding `[<index>]: data:...` definition is appended to the end of the file, using the current Unix timestamp as the index.
- **Consequences**: No separate image-asset folder to manage — the `.md` file is self-contained. File size grows roughly 1.33x the original image size (base64 overhead). The extension's custom drop handling coexists uneasily with VS Code's own built-in Markdown drop handling (addressed in ADR-004 and later reworked in ADR-014).

---

## ADR-002: Split the codebase into `model` / `modules` / `providers`

- **Status**: Accepted
- **Commits**: `317d3de`
- **Context**: Avoid concentrating all logic in a single `extension.ts`; keep VS Code API-dependent code separate from pure logic.
- **Decision**: From the first commit, the codebase is organized as `src/model` (types/enums), `src/modules` (pure helper functions: `file-extension`, `import-text`, `notify`, `relative-path`), and `src/providers` (the document selector and the list of supported image extensions). `src/auto-import-on-drop-provider.ts` implements `DocumentDropEditProvider` and wires these pieces together.
- **Consequences**: Individual modules are straightforward to reason about and test in isolation. For an extension this small, the indirection is somewhat more than strictly necessary, but it kept the codebase navigable as features were added incrementally over multiple years.

---

## ADR-003: Support dragging from the Explorer and dropping into inactive panes

- **Status**: Accepted
- **Commits**: `5d6b193`, `b36a114`
- **Context**: Initially, only drops originating from inside the currently active editor worked; dragging an image from VS Code's Explorer view, or dropping into a pane that wasn't the active one, silently failed.
- **Decision**: Restructured `getDragFile()` / `getImportData()` (`src/modules/import-text.ts`) to prefer the DataTransfer's `file` object, falling back to a `text/plain` path string when unavailable. Changed how the target editor is located — from "whichever editor is currently active" to filtering `vscode.window.visibleTextEditors` for the one whose `document` matches the drop target.
- **Consequences**: The extension now works regardless of where the drag originated, and can target a pane that isn't focused. The limitation that dropping multiple files at once only pastes one remained unaddressed (documented in the README's "Known Issues" from this point on).

---

## ADR-004: Require `markdown.editor.drop.enabled = false`

- **Status**: Superseded by ADR-014
- **Commits**: `7582f93`, `e6bb8e3`
- **Context**: The extension's custom drop provider (ADR-001) competed with VS Code's own built-in Markdown image-drop handling, producing duplicate or conflicting results on drop.
- **Decision**: Documented in the README's "Known Issues" that users must set `markdown.editor.drop.enabled` to `false` for the extension to behave correctly.
- **Consequences**: Required manual, undiscoverable configuration from every user. This setting was a boolean at the time; VS Code 1.125.0 later changed it to a string enum (`"always"` / `"smart"` / `"never"`), which broke the documented instruction outright and forced a redesign — see ADR-014.

---

## ADR-005: Case-insensitive extension matching

- **Status**: Accepted
- **Commits**: `9a028c3`
- **Decision**: Lower-case the dropped file's path (`dragFilePath.toLowerCase()`) before comparing it against the list of supported extensions, so uppercase extensions like `.PNG` are also accepted.
- **Consequences**: Simple fix; since the lower-cased value is only used for the extension-matching comparison, it has no effect on the actual inserted paths or filenames.

---

## ADR-006: Consolidate path handling for cross-platform support (macOS/Linux/WSL)

- **Status**: Accepted (later revised for Windows drive-letter edge cases by ADR-014)
- **Commits**: `2f8f6e9` (WSL support, contributed externally by sato yoshiyuki via PR #2, merged in `2c3a7dd`), `a4ed7b7`, `f928dd5`
- **Context**: Relying on Node's `path.basename` and the DataTransfer's `fsPath` did not work correctly under WSL (whose path representation mixes backslashes into what looks like a POSIX path) or on native macOS/Linux.
- **Decision**:
  - Introduced a `DragFileInfo { filePath, base64 }` type and consolidated file-info retrieval into a single `getDragFile()` function.
  - Preferred the DataTransfer `file` object when available, falling back to a `text/plain` path string only when it wasn't; added a string replacement to correct WSL's backslash-based path notation.
  - Replaced `path.basename` with a custom `basename()` that determines the separator by checking whether the path starts with `/` or `\`, rather than delegating to Node's `path` module.
  - Renamed the `filepath` property to `filePath` throughout, to conform to camelCase convention.
- **Consequences**: Windows/macOS/Linux/WSL shared a single code path, reducing platform-specific branching elsewhere in the codebase. The trade-off was hand-rolled separator detection instead of relying on Node's standard `path` module — a decision that indirectly enabled a Windows drive-letter bug much later (see ADR-014), since the custom path logic didn't go through Node's more battle-tested path-resolution code.

---

## ADR-007: Documentation and asset maintenance (icon, demo GIF, badges)

- **Status**: Accepted
- **Commits**: `e4f9c62`, `ae7a837`, `5522f62`, `350b529`, `d526c6c`, `51d51b2`, `3e66027`, `b62e1fe`
- **Context**: Ongoing README/asset upkeep rather than a single architectural decision: adding a demo animation, an extension icon, release notes, and (much later, after a roughly 2.5-year gap between `51d51b2` and `3e66027`) a DeepWiki badge and an MIT license badge.
- **Decision**: Iteratively added these to the README and `package.json`, including two same-day fixups (`350b529`, `d526c6c`) correcting an incorrect icon filename and an unbumped version number from the preceding release-notes commit.
- **Consequences**: No code-architecture impact. Notable only as evidence that release hygiene (icon path, version bump) wasn't originally scripted or verified before commit, leading to two immediate follow-up fixes.

---

## ADR-008: Supply-chain hardening via `.npmrc`

- **Status**: Accepted
- **Commits**: `fcec584`
- **Context**: `npm install` runs dependency lifecycle scripts (e.g. `postinstall`) unconditionally by default, and can install a package version immediately after publication even if it's later found to be compromised.
- **Decision**: Added `.npmrc` with `ignore-scripts=true` and `min-release-age=7`.
- **Consequences**: Lifecycle scripts are disabled (packages that need native builds may require manual intervention). Package versions published less than 7 days ago are not installed, trading immediacy for reduced supply-chain risk. (Note: `min-release-age` is a pnpm-specific setting and is silently ignored by npm — see ADR-010.)

---

## ADR-009: Add a public landing page (`docs/index.html`) and `llms.txt`

- **Status**: Accepted
- **Commits**: `d6140c1`, `3273870`, `d873eea`, `0d0b625`, `b809db1`
- **Context**: The extension had no presence outside the VS Code Marketplace and the GitHub README — no dedicated landing page for organic discovery, and no machine-readable summary for LLM-based tools.
- **Decision**: Added a Pico.css-based `docs/index.html` (Open Graph tags, X.com/Twitter card, JSON-LD `SoftwareApplication` schema) and `docs/llms.txt`, intended for GitHub Pages hosting. Added `docs/social-preview.png` and `docs/icon256.png`, and iterated the Open Graph/Twitter image URLs twice (first pointed at GitHub Pages, then at the dedicated social-preview image) to fix broken link previews.
- **Consequences**: Introduced two more places (`docs/index.html`, `docs/llms.txt`) that must be kept in sync with `README.md` whenever user-facing behavior, requirements, or the version number change — this maintenance burden materialized concretely in ADR-014, which required updating all three files.

---

## ADR-010: Abandon a pnpm migration attempt and settle on npm

- **Status**: Accepted (reversed an in-progress change)
- **Commits**: `8fd7835` (pnpm adopted), `77f85a2` (partial cleanup), `4d36419` (pnpm files removed), `c77aae8` (npm lockfile finalized)
- **Context**: The project briefly switched package managers to pnpm (`pnpm-workspace.yaml`, `pnpm-lock.yaml` added in `8fd7835`, alongside a large `package.json` dependency churn). This left `node_modules` in a mixed npm/pnpm state; `vsce package` — which relies on npm-oriented tooling internally to walk the dependency tree — could not interpret pnpm's `node_modules/.pnpm` virtual store, producing thousands of spurious "missing dependency" errors. The mixed state also caused local environment breakage (e.g. the `tsc` binary becoming unresolvable).
- **Decision**: Removed `pnpm-workspace.yaml` and `pnpm-lock.yaml` (`4d36419`); standardized on npm (`package-lock.json`) as the project's sole package manager (`c77aae8`).
- **Consequences**: `npm install` / `vsce package` work reliably again. Any future `node_modules` corruption should be resolved with `rm -rf node_modules && npm install`, not a pnpm equivalent. The `.npmrc`'s `min-release-age` setting from ADR-008 remains a vestige of considering pnpm — npm silently ignores it.

---

## ADR-011: Migrate the linter from ESLint to Biome

- **Status**: Accepted
- **Commits**: `b4d149c`
- **Context**: The project used ESLint (`.eslintrc.json`) with `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`, enforcing four rules (`curly`, `eqeqeq`, `@typescript-eslint/naming-convention`, `no-throw-literal`) as warnings.
- **Decision**: Removed ESLint and its TypeScript plugins from `devDependencies`; added `@biomejs/biome@2.5.7` and `biome.json`, deliberately disabling Biome's `recommended` preset and enabling only the two rules with a direct equivalent to the prior ESLint set (`style/useNamingConvention`, `suspicious/noDoubleEquals`). `package.json`'s `lint` script changed from `eslint src --ext ts` to `biome check src`.
- **Consequences**: Lint behavior stayed close to the pre-migration baseline (the same two pre-existing naming-convention warnings on `src/model/enums.ts` persisted, exit code 0). Rule coverage narrowed slightly (`curly`, `no-throw-literal` no longer enforced), a deliberate trade-off to avoid introducing unrelated new warnings from Biome's fuller recommended preset.

---

## ADR-012: Add AGENTS.md for AI coding agent guidance

- **Status**: Accepted
- **Commits**: `40ad315`
- **Context**: No dedicated onboarding document existed for AI coding agents working in the repo (file layout, conventions, build/lint commands, known caveats).
- **Decision**: Added `AGENTS.md` documenting the tech stack, key files, conventions, commands, and known caveats; added a one-line reference to it from `CLAUDE.md`.
- **Consequences**: Faster agent onboarding, at the cost of a fourth document (alongside `README.md`, `docs/index.html`, `docs/llms.txt`) that needs to stay in sync with the codebase — it required a follow-up correction after ADR-014 changed the `markdown.editor.drop.enabled` guidance it originally documented.

---

## ADR-013: Make `glob` an explicit dependency and adopt its Promise API

- **Status**: Accepted
- **Commits**: `31fed9a`, `53eb1aa` (partial)
- **Context**: `src/test/suite/index.ts` called `glob()` with the old callback signature (`glob(pattern, opts, cb)`), but `glob` itself was never declared in `package.json` — only `@types/glob` was, as a devDependency. This worked by accident under npm's loose hoisting (some other dependency's transitive `glob` happened to be resolved at runtime) and broke once the resolved `glob` version's actual API no longer matched.
- **Decision**: Added `glob` (`^13.0.6`) directly to `devDependencies`, removed `@types/glob` (modern `glob` ships its own types), and rewrote the test runner to `await glob(pattern, opts)` instead of the callback form.
- **Consequences**: The test runner no longer depends on an undeclared phantom dependency; its resolved `glob` version is explicit and reproducible regardless of hoisting behavior or package manager.

---

## ADR-014: Rework the drop provider for VS Code 1.125.0 compatibility

- **Status**: Accepted
- **Commits**: `53eb1aa`, `f0f8b16`, `81b71c7` (docs sync)
- **Context**: VS Code 1.125.0 changed `markdown.editor.drop.enabled` from a boolean to a string enum, breaking the instruction from ADR-004 outright. Independently, the extension's original imperative drop handling — calling `editor.edit()` manually while returning an empty `insertText: ""` from `provideDocumentDropEdits` — stopped reliably inserting the DataURL once the built-in Markdown provider was no longer competing for the same drop. Separately, `getDragFile()`'s mime-type-guessing loop failed to resolve files dropped from VS Code's own Explorer or the OS file manager, and on Windows, the resolved `Uri`'s `.path`/`.fsPath` could silently drop the drive letter (e.g. `E:\...` resolving as `\...`, read by Node relative to the process's current drive, typically `C:`), producing `ENOENT` errors — the flip side of the hand-rolled path logic decided in ADR-006.
- **Decision**:
  - `provideDocumentDropEdits` now returns `insertText` (the reference link) together with `additionalEdit: WorkspaceEdit` (the DataURL definition appended at the end of the file), letting VS Code apply both edits atomically instead of mutating the editor imperatively.
  - `getDragFile()` was rewritten to iterate all `DataTransfer` entries and try `.asFile()` regardless of mime type, falling back to parsing `text/uri-list` (the standard carrier for resources dragged from the explorer or the OS) via `vscode.Uri.parse`.
  - Added a Windows-specific `resolveFsPath()` correction that recovers a dropped `Uri`'s drive letter from its raw string form when `.path`/`.fsPath` have normalized it away, guarded so it never triggers on POSIX-style paths.
  - Wrapped `provideDocumentDropEdits` in try/catch, surfacing failures via `vscode.window.showErrorMessage` instead of failing silently.
  - Removed the unused `src/modules/relative-path.ts` module.
  - Dropped the requirement (ADR-004) that `markdown.editor.drop.enabled` be `false`/`"never"` — the reworked provider no longer depends on disabling the built-in handler; the setting is now documented only as an optional mitigation.
  - Bumped the minimum VS Code version to `1.125.0` to match the APIs relied on, and propagated the updated requirements/limitations to `README.md`, `docs/index.html`, and `docs/llms.txt`.
- **Consequences**: Fixes drag-and-drop on VS Code 1.125.0+, including a Windows-only path-resolution bug that took several iterations of production debugging (Extension Host console logging was added and later removed during the investigation) to pin down. macOS/Linux are unaffected by the Windows-specific fix and were not independently re-verified — the code is designed to be a no-op on those platforms.

---

## Notes (not architecture decisions, but recorded for reference)

- **Empty commits**: `f65988f`, `a501d29` (both dated 2025-12-30, no message, no diff). Purpose unclear; consider deleting or squashing if unintentional.
- **`.gitignore` addition** (`fce4a95`): added `graphify-out` to stop tracking generated tool output. Housekeeping, not an architecture decision.
- **Historical local/remote divergence**: earlier analysis of this history noted that local `master` once lagged behind `origin/master` (stuck at `51d51b2` while remote had advanced to `fcec584`). That gap is closed as of `81b71c7` — the current `master` is a linear line through all commits listed above.
- **Version jump to 0.1.0**: `c77aae8` and `81b71c7` bump `package.json`'s version directly from `0.0.6` to `0.1.0`, treating the VS Code 1.125.0 compatibility fixes (ADR-010, ADR-013, ADR-014) as a minor version bump rather than a string of patch releases, since the underlying VS Code API/setting break was significant enough to warrant it.
- **Prediction that held**: ADR-004's constraint ("this extension assumes exclusive use against VS Code's built-in drop handling") was flagged early as fragile if VS Code's drop-API priority control ever changed. ADR-014 is exactly that redesign, roughly three years later.
