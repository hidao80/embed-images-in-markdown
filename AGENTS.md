# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

A VS Code extension ("Embed images in markdown") that lets users drag-and-drop an image file onto a markdown document (while holding `Shift`) and have it embedded as a base64 DataURL. The image is inserted as a reference link at the drop position, and the DataURL definition is appended to the end of the file.

## Tech stack

- TypeScript, compiled with `tsc` (`tsconfig.json`: `target: ES2020`, `module: commonjs`, `strict: true`).
- VS Code Extension API (`vscode.DocumentDropEditProvider`).
- Packaged with `@vscode/vsce`.
- Tests: Mocha via `@vscode/test-electron`.

## Key files

- `src/extension.ts` — extension entry point (`activate`). Registers the drop provider.
- `src/auto-import-on-drop-provider.ts` — `EmbeddingImagesOnDropProvider`, the core drag-and-drop handler. Validates the dropped file, converts it to a DataURL, and edits the document.
- `src/modules/` — small single-purpose helpers (file extension checks, import tag/text generation, notifications, relative path resolution). One function per file.
- `src/model/` — shared enums and types (e.g. `NotifyType`).
- `src/providers/` — document selectors and the list of supported image extensions (`png`, `jpeg`, `jpg`, `gif`, `webp`).
- `src/test/` — Mocha test suite (`suite/extension.test.ts`) run through `runTest.ts`.
- `package.json` — extension manifest (VS Code `engines.vscode` requirement, activation events, scripts).

## Conventions

- Files are small and organized by responsibility (`modules/`, `model/`, `providers/`), not by type dump. Follow this pattern when adding new logic — prefer a new small module over growing an existing file.
- `strict` TypeScript is enabled; keep new code strict-clean.
- Biome config (`biome.json`) enforces `noDoubleEquals` (eqeqeq) and `useNamingConvention` as warnings. Run `bun run lint` before considering work done.
- Match the existing indentation and brace style in the file you're editing rather than reformatting.

## Commands

```bash
bun run compile   # tsc -p ./
bun run watch     # same as compile, no watch mode currently configured beyond this
bun run lint      # eslint src --ext ts
bun run build     # compile + vsce package
```

There is no automated test script wired into `package.json` yet — tests live under `src/test/` and are run via `@vscode/test-electron` (`src/test/runTest.ts`).

## Known caveats

- `markdown.editor.drop.enabled` must be `false` in the user's VS Code settings for drag-and-drop to work — this is a VS Code setting conflict, not a bug.
- Dropping multiple files at once only pastes one.
- `uuid` was removed as a dependency (was unused in `src/`) during a dependency security cleanup — don't reintroduce it without checking it's actually needed.

## Before committing

- Run `bun run compile` and `bun run lint`.
- Bump `version` in `package.json` and add an entry to the "Release Notes" section of `README.md` for user-facing changes.
