/**
 * Keybinding customization: merge user overrides with default bindings.
 *
 * Users can override specific actions or add entirely new bindings.
 * The override strategy is:
 * - "replace": remove all default bindings for the action, use the override's
 * - "add": keep default bindings and append the override's
 * - "remove": remove all bindings for the action (disable it)
 */

import type { KeyBinding, KeyBindingMap } from "./keybinding";

/** A single override entry */
export type KeyBindingOverride<A extends string> = {
  readonly action: A;
} & (
  | { readonly strategy: "replace"; readonly binding: KeyBinding }
  | { readonly strategy: "add"; readonly binding: KeyBinding }
  | { readonly strategy: "remove" }
);

/** A set of user overrides */
export type KeyBindingOverrides<A extends string> =
  readonly KeyBindingOverride<A>[];

/** Apply user overrides to a default binding map.
 *
 *  Processing order:
 *  1. "remove" overrides: remove all entries for those actions
 *  2. "replace" overrides: remove existing + add new
 *  3. "add" overrides: append new entries
 *
 *  Pure function.
 */
export function applyOverrides<A extends string>(
  defaults: KeyBindingMap<A>,
  overrides: KeyBindingOverrides<A>,
): KeyBindingMap<A> {
  // Collect actions to remove
  const removeActions = new Set<string>();
  const replaceActions = new Map<string, KeyBinding>();
  const addEntries: KeyBindingMap<A>[number][] = [];

  for (const override of overrides) {
    switch (override.strategy) {
      case "remove":
        removeActions.add(override.action);
        break;
      case "replace":
        removeActions.add(override.action);
        replaceActions.set(override.action, override.binding);
        break;
      case "add":
        addEntries.push({
          action: override.action,
          binding: override.binding,
        });
        break;
    }
  }

  // Filter defaults
  const filtered = defaults.filter((entry) => !removeActions.has(entry.action));

  // Add replacements
  const replacements: KeyBindingMap<A>[number][] = [];
  for (const [action, binding] of replaceActions) {
    replacements.push({ action: action as A, binding });
  }

  return [...filtered, ...replacements, ...addEntries];
}
