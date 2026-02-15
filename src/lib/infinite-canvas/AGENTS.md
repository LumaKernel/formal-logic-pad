# infinite-canvas Library - Agent Notes

## File Naming Convention

- macOS has a case-insensitive file system, so `Foo.tsx` and `foo.ts` CANNOT coexist as separate files
- Pure logic files use lowercase (e.g., `connectionPath.ts`, `drag.ts`, `pan.ts`)
- React component files use PascalCase (e.g., `Connection.tsx`, `CanvasItem.tsx`)
- When creating a new feature, ensure the logic file name differs from the component name (e.g., `connectionPath.ts` + `Connection.tsx`, NOT `connection.ts` + `Connection.tsx`)

## Architecture Pattern

- Pure functions (coordinate transforms, math, path computation) in separate `.ts` files
- React hooks (`usePan.ts`, `useZoom.ts`, `useDragItem.ts`) bridge pure logic to React
- Components (`InfiniteCanvas.tsx`, `CanvasItem.tsx`, `Connection.tsx`) combine hooks and pure functions
- All exports go through `index.ts` barrel file

## Testing

- Unit tests use `@testing-library/react` + Vitest with jsdom environment
- Storybook stories have play functions for interaction testing (import from `storybook/test`)
- `setPointerCapture`/`releasePointerCapture` must be mocked in jsdom tests
- SVG attributes in jsdom: use `getAttribute()` (e.g., `path.getAttribute("stroke")`) not style properties

## Coordinate System

- World-space: logical coordinates for items (position prop)
- Screen-space: pixel coordinates for rendering
- Transformation: `screen = world * scale + offset` via `worldToScreen()`
- CanvasItem `position` is top-left corner in world-space
