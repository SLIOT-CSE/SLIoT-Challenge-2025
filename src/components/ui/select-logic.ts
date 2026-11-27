export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RectLike {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface ContainerOffset {
  top: number;
  left: number;
  height: number;
}

export interface MenuPlacement {
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
  top?: number;
  bottom?: number;
}

const VIEWPORT_MARGIN = 12;
const TRIGGER_GAP = 6;
const DEFAULT_MAX_HEIGHT = 300;
const MIN_COMFORTABLE_HEIGHT = 180;
const MIN_USABLE_HEIGHT = 120;

/**
 * Filter dropdown options by search text.
 * Placeholder options (`value === ""`) hide while filtering so matches stay focused,
 * and `pinnedValues` (such as `"__other"`) stay visible at the bottom as a fallback.
 */
export function filterSelectOptions(
  options: readonly SelectOption[],
  query: string,
  pinnedValues: readonly string[] = [],
): SelectOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...options];

  const pinned = new Set(pinnedValues);
  return options.filter((option) => {
    if (pinned.has(option.value)) return true;
    if (option.value === "") return false;
    return option.label.toLowerCase().includes(normalized);
  });
}

/**
 * Compute the next enabled highlight index for keyboard navigation.
 */
export function moveHighlightIndex(
  options: readonly SelectOption[],
  currentIndex: number,
  direction: "next" | "prev" | "first" | "last",
): number {
  const enabledIndices: number[] = [];
  for (let i = 0; i < options.length; i++) {
    if (!options[i]?.disabled) enabledIndices.push(i);
  }
  if (enabledIndices.length === 0) return -1;

  if (direction === "first") return enabledIndices[0];
  if (direction === "last") return enabledIndices[enabledIndices.length - 1];

  const currentPos = enabledIndices.indexOf(currentIndex);
  if (currentPos === -1) {
    return direction === "next" ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1];
  }

  const step = direction === "next" ? 1 : -1;
  const nextPos = (currentPos + step + enabledIndices.length) % enabledIndices.length;
  return enabledIndices[nextPos];
}

/**
 * Find the next enabled option matching a keyboard type-ahead prefix.
 */
export function findTypeaheadMatch(
  options: readonly SelectOption[],
  query: string,
  fromIndex: number,
): number {
  const normalized = query.trim().toLowerCase();
  if (!normalized || options.length === 0) return -1;

  const start = fromIndex >= 0 ? (fromIndex + 1) % options.length : 0;
  for (let offset = 0; offset < options.length; offset++) {
    const idx = (start + offset) % options.length;
    const option = options[idx];
    if (option && !option.disabled && option.label.trim().toLowerCase().startsWith(normalized)) {
      return idx;
    }
  }
  return -1;
}

/**
 * Compute viewport-clamped popup geometry relative to either the viewport (`container` omitted)
 * or a positioned ancestor container such as an open Dialog.
 */
export function computeMenuPlacement(
  triggerRect: RectLike,
  viewport: { width: number; height: number },
  container?: ContainerOffset,
  preferredMaxHeight = DEFAULT_MAX_HEIGHT,
  preferredMinWidth = 240,
): MenuPlacement {
  const maxAllowedWidth = Math.max(0, viewport.width - VIEWPORT_MARGIN * 2);
  const desiredWidth = Math.max(triggerRect.width, Math.min(preferredMinWidth, maxAllowedWidth));
  const width = Math.min(desiredWidth, maxAllowedWidth);

  const clampedLeftViewport = Math.min(
    Math.max(triggerRect.left, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, viewport.width - VIEWPORT_MARGIN - width),
  );

  const spaceBelow = Math.max(0, viewport.height - triggerRect.bottom - VIEWPORT_MARGIN - TRIGGER_GAP);
  const spaceAbove = Math.max(0, triggerRect.top - VIEWPORT_MARGIN - TRIGGER_GAP);

  const placement: "bottom" | "top" =
    spaceBelow >= Math.min(preferredMaxHeight, MIN_COMFORTABLE_HEIGHT) || spaceBelow >= spaceAbove
      ? "bottom"
      : "top";

  const availableSpace = placement === "bottom" ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(MIN_USABLE_HEIGHT, Math.min(preferredMaxHeight, availableSpace));

  const offsetLeft = container?.left ?? 0;
  const offsetTop = container?.top ?? 0;
  const containerHeight = container?.height ?? viewport.height;

  const left = clampedLeftViewport - offsetLeft;

  if (placement === "bottom") {
    return {
      left,
      width,
      maxHeight,
      placement,
      top: triggerRect.bottom + TRIGGER_GAP - offsetTop,
    };
  }

  return {
    left,
    width,
    maxHeight,
    placement,
    bottom: containerHeight - (triggerRect.top - TRIGGER_GAP - offsetTop),
  };
}
