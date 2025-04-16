# Development Plan: Figma Fridays Plugin Node Traversal Fix

## Objective
Track the analysis and implementation steps to address the node traversal issue in the Figma Community version of the plugin, ensuring minimal, robust changes aligned with project best practices.

---

## Task List & Progress

### 1. Analysis & Context Gathering
- [x] Review `.windsurfrules` for project constraints
- [x] Review `best_practices.md` for coding guidelines
- [ ] Analyze `index.html` for UI logic and message passing
- [ ] Identify and review main plugin logic file in `src/` (likely responsible for node traversal)
- [ ] Compare console logs from local vs. Community version (awaiting user input)
- [ ] Use MCP server tools to inspect a Figma file (planned)

### 2. Hypothesis & Diagnosis
- [x] Pinpointed traversal halts due to use of `figma.getNodeById` (sync) in Community mode
- [x] Root cause: Community plugins require `figma.getNodeByIdAsync` for document access

### 3. Implementation
- [ ] Propose minimal, robust code changes (try/catch, null checks, improved traversal)
- [ ] Add/expand logging for traversal state and errors
- [ ] Test changes locally and, if possible, in Community mode

#### Detailed Async Refactor Plan (fix-async-node-traversal branch)

**Goal:** Replace all synchronous `figma.getNodeById` calls with asynchronous `figma.getNodeByIdAsync`, update affected logic to async/await, and add defensive programming and logging as per best practices.

**Code Locations & Required Changes:**

1. **src/plugin/services/visualization.ts**
   - `VisualizationService.getNodePath(nodeId: string): string[]`
     - Change to `async`, use `await figma.getNodeByIdAsync(nodeId)`
     - Update all callers to await this function
     - Add try/catch and null checks
   - `VisualizationService.findParentFrame(nodeId: string): SceneNode | null`
     - Change to `async`, use `await figma.getNodeByIdAsync(nodeId)`
     - Update callers, add defensive checks
   - `VisualizationService.formatInteraction(interaction: InteractionData): string`
     - Change to `async` if using destinationId, use `await figma.getNodeByIdAsync`
     - Update all code paths and UI logic to handle async
   - `VisualizationService.parseReactions` and related usages
     - If using `figma.getNodeById`, migrate to async

2. **src/plugin/services/interaction-detector.ts**
   - Check for any use of `figma.getNodeById` in reaction parsing or node context logic, migrate to async if found

3. **src/plugin/services/interaction-parser.ts**
   - If `getNodePath` or similar uses `figma.getNodeById`, migrate to async

4. **All Callers and Downstream Logic**
   - Update all functions that call the above to be async and use `await`
   - Ensure UI messaging and traversal logic handle promises properly

5. **Defensive Programming & Logging**
   - Add try/catch around every async node access
   - Add null/undefined checks after each await
   - Add `console.log` before/after each async node access for debugging

6. **Testing**
   - Test locally and in Community mode
   - Compare logs to confirm traversal proceeds past first node

**Note:**
- All changes must be minimal and targeted, with clear comments on async migration and any workarounds for Figma Community restrictions.

### 4. Documentation & Review
- [ ] Comment all workaround/defensive logic
- [ ] Document limitations and reasoning
- [ ] Prepare code for review and update

---

## Async Migration Progress Log (2025-04-16)

### Summary of Completed Actions

**Key async migration and defensive programming steps completed for Figma Community compatibility:**

#### 1. src/plugin/services/visualization.ts
- Refactored `findParentFrame` and `getNodePath` to use `await figma.getNodeByIdAsync`, added async/await propagation, try/catch, and logging.
- Updated `groupInteractionsByScreen` to propagate async/await to all callers.
- Updated `createDocumentationNodes` to await async grouping, with defensive error handling and logging.

#### 2. src/plugin/services/interaction-detector.ts
- Migrated `parseReactions` to async, using `figma.getNodeByIdAsync` and robust try/catch/logging.
- Updated `getInteractions` to await `parseReactions` and propagate async/await, with defensive programming and comments.
- Migrated `getScreenContext` to async, awaiting `findParentFrame` and `getNodePath`, with try/catch and logging.

#### 3. src/plugin/services/interaction-parser.ts
- Migrated `findParentFrame` and `getNodePath` to async, with try/catch and logging for robust error handling.
- Updated `getScreenContext` to await these functions, with defensive programming.

#### 4. Downstream and Callers
- Propagated async/await to all affected callers in the above files.
- Ensured all error handling and logging is consistent and defensive.

### Remaining Steps
- Review for any overlooked synchronous node traversal or access and migrate if found.
- Ensure all UI and downstream logic properly handles async flows and Promises.
- Address outstanding lint/type errors (notably missing Figma typings).
- Test plugin in both local and Community environments.
- Document any limitations, workarounds, and defensive logic in code comments.

---

## Notes
- All changes must adhere to the single-file, inline JS/CSS, and defensive programming guidelines.
- Focus on minimal, targeted fixes to ensure plugin reliability across environments.

## Figma File:
https://www.figma.com/design/zt8lTTgNoIqiFr1BH7p5ea/Test-for-interactivity?node-id=0-1&t=wdVvg4AmNMBvKJSS-1