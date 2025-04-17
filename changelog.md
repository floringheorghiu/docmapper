# Changelog

All notable changes to this project.

## [0.2.6] - 2025-04-17

### Changed

- Refactored plugin code to migrate synchronous node retrieval methods to asynchronous (`figma.getNodeByIdAsync`):
  - `VisualizationService`: `findParentFrame`, `getNodePath`, and `formatInteraction` are now async with error handling.
  - `InteractionDetector`: `parseReactions`, `getScreenContext`, and downstream calls (`getInteractions`) use `async/await`.
  - `InteractionParser`: `findParentFrame`, `getNodePath`, and `getScreenContext` are async.
- Propagated `async/await` through callers, including `createElementSection`, `createScreenSections`, `createDocumentationNodes`, and the UI handler in `index.ts`.
- Updated `PluginController.processNode` to `await` `getScreenContext`.
- Fixed UI code in `index.ts` to `await` `getInteractions` before accessing `.length` and iterating.

### Added

- Defensive error handling (`try/catch`) and detailed console logging around async calls for robustness.

### Fixed

- Explicitly typed `screenGroups` as `ScreenInteractions[]` to resolve TypeScript implicit any errors.
- Removed `vitest/globals` from `tsconfig.json` to fix missing type definitions.
- Ensured build configuration outputs `dist/plugin.js`, resolving Figma load errors after cleaning `dist`.
