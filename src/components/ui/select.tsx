"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { controlClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  computeMenuPlacement,
  filterSelectOptions,
  findTypeaheadMatch,
  moveHighlightIndex,
  type MenuPlacement,
  type SelectOption,
} from "./select-logic";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  children?: ReactNode;
  /** Shows a filter box at the top of the menu, suited for long lists like universities. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Option values kept at the bottom even when a search query hides non-matching options. */
  pinnedValues?: readonly string[];
  emptyMessage?: string;
}

function readNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(readNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return readNodeText(node.props.children);
  return "";
}

function parseOptions(children: ReactNode): SelectOption[] {
  const result: SelectOption[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement<Record<string, unknown>>(child)) continue;
    if (child.type === Fragment) {
      result.push(...parseOptions(child.props.children as ReactNode));
      continue;
    }
    if (child.type === "option") {
      const el = child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
      const label = readNodeText(el.props.children);
      const value = el.props.value !== undefined ? String(el.props.value) : label;
      result.push({ value, label, disabled: Boolean(el.props.disabled) });
    }
  }
  return result;
}

// Custom dark-aurora themed listbox replacing the browser-native <select> popup while keeping the
// <Select><option>…</option></Select> API and keyboard / WCAG 2.2 AA accessibility intact.
export function Select({
  id,
  name,
  className,
  children,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  required,
  searchable = false,
  searchPlaceholder = "Search…",
  pinnedValues = [],
  emptyMessage = "No matching options",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const triggerId = id ?? `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;

  const options = useMemo(() => parseOptions(children), [children]);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? ""),
  );
  const currentValue = isControlled ? String(value) : uncontrolledValue;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [insideDialog, setInsideDialog] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typeaheadRef = useRef({ buffer: "", timer: 0 as ReturnType<typeof setTimeout> | 0 });

  const pinnedSet = useMemo(() => new Set(pinnedValues), [pinnedValues]);
  const visibleOptions = useMemo(
    () => (searchable ? filterSelectOptions(options, query, pinnedValues) : options),
    [options, pinnedValues, query, searchable],
  );

  const selectedOption = useMemo(
    () => options.find((o) => o.value === currentValue) ?? options[0],
    [currentValue, options],
  );
  const isPlaceholder = !selectedOption || selectedOption.value === "";

  const measureAndPlace = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const dialog = trigger.closest<HTMLElement>('[role="dialog"]');
    const triggerRect = trigger.getBoundingClientRect();
    const containerOffset = dialog
      ? (() => {
          const rect = dialog.getBoundingClientRect();
          return { top: rect.top, left: rect.left, height: rect.height };
        })()
      : undefined;

    setPortalTarget(dialog ?? document.body);
    setInsideDialog(Boolean(dialog));
    setPlacement(
      computeMenuPlacement(
        triggerRect,
        { width: window.innerWidth, height: window.innerHeight },
        containerOffset,
        searchable ? 340 : 280,
      ),
    );
  };

  useLayoutEffect(() => {
    if (!open) return;
    measureAndPlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const updatePosition = (event?: Event) => {
      if (event?.target instanceof Node && menuRef.current?.contains(event.target)) return;
      measureAndPlace();
    };
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    // Focus search box or listbox after portal mounts so keyboard navigation works immediately.
    const raf = requestAnimationFrame(() => {
      if (searchable) {
        searchInputRef.current?.focus({ preventScroll: true });
      } else {
        listboxRef.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
      onBlur?.({ target: triggerRef.current } as unknown as FocusEvent<HTMLSelectElement>);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onBlur]);

  const defaultHighlightFor = (list: readonly SelectOption[]) => {
    const selectedIdx = list.findIndex((o) => o.value === currentValue && !o.disabled);
    return selectedIdx >= 0 ? selectedIdx : moveHighlightIndex(list, -1, "first");
  };

  const effectiveHighlightedIndex =
    highlightedIndex >= 0 &&
    highlightedIndex < visibleOptions.length &&
    !visibleOptions[highlightedIndex]?.disabled
      ? highlightedIndex
      : defaultHighlightFor(visibleOptions);

  useEffect(() => {
    if (!open || effectiveHighlightedIndex < 0) return;
    optionRefs.current[effectiveHighlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [effectiveHighlightedIndex, open]);

  const openMenu = () => {
    if (disabled) return;
    setQuery("");
    setHighlightedIndex(defaultHighlightFor(options));
    setOpen(true);
  };

  const updateSearchQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    const nextVisible = filterSelectOptions(options, nextQuery, pinnedValues);
    setHighlightedIndex(defaultHighlightFor(nextVisible));
  };

  const closeMenu = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
    }
  };

  const commitValue = (nextValue: string) => {
    if (!isControlled) setUncontrolledValue(nextValue);
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);
    closeMenu(true);
  };

  const handleTypeahead = (char: string) => {
    if (char.length !== 1 || /\s/.test(char)) return false;
    const state = typeaheadRef.current;
    if (state.timer) clearTimeout(state.timer);
    state.buffer += char.toLowerCase();
    state.timer = setTimeout(() => {
      state.buffer = "";
    }, 550);

    const list = open ? visibleOptions : options;
    const from = open ? effectiveHighlightedIndex : list.findIndex((o) => o.value === currentValue);
    let match = findTypeaheadMatch(list, state.buffer, from);
    if (match < 0 && state.buffer.length > 1) {
      state.buffer = char.toLowerCase();
      match = findTypeaheadMatch(list, state.buffer, from);
    }
    if (match >= 0) {
      if (open) {
        setHighlightedIndex(match);
      } else {
        const matched = list[match];
        if (matched) commitValue(matched.value);
      }
      return true;
    }
    return false;
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) closeMenu(true);
      else openMenu();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      if (searchable && event.key.length === 1) {
        openMenu();
      } else {
        handleTypeahead(event.key);
      }
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setHighlightedIndex(moveHighlightIndex(visibleOptions, effectiveHighlightedIndex, "next"));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setHighlightedIndex(moveHighlightIndex(visibleOptions, effectiveHighlightedIndex, "prev"));
        break;
      }
      case "Home": {
        if (!searchable || event.currentTarget === listboxRef.current) {
          event.preventDefault();
          setHighlightedIndex(moveHighlightIndex(visibleOptions, -1, "first"));
        }
        break;
      }
      case "End": {
        if (!searchable || event.currentTarget === listboxRef.current) {
          event.preventDefault();
          setHighlightedIndex(moveHighlightIndex(visibleOptions, -1, "last"));
        }
        break;
      }
      case "Enter": {
        event.preventDefault();
        const item = visibleOptions[effectiveHighlightedIndex];
        if (item && !item.disabled) commitValue(item.value);
        break;
      }
      case " ": {
        if (!searchable || event.currentTarget === listboxRef.current) {
          event.preventDefault();
          const item = visibleOptions[effectiveHighlightedIndex];
          if (item && !item.disabled) commitValue(item.value);
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        closeMenu(true);
        break;
      }
      case "Tab": {
        closeMenu(false);
        onBlur?.({ target: triggerRef.current } as unknown as FocusEvent<HTMLSelectElement>);
        break;
      }
      default: {
        if (!searchable && !event.ctrlKey && !event.metaKey && !event.altKey) {
          handleTypeahead(event.key);
        }
      }
    }
  };

  const handleTriggerBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const next = event.relatedTarget as Node | null;
    if (open || (next && menuRef.current?.contains(next))) return;
    onBlur?.({ target: triggerRef.current } as unknown as FocusEvent<HTMLSelectElement>);
  };

  const handleMenuBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && (menuRef.current?.contains(next) || triggerRef.current?.contains(next))) return;
    if (!next) return;
    closeMenu(false);
    onBlur?.({ target: triggerRef.current } as unknown as FocusEvent<HTMLSelectElement>);
  };

  const activeOptionId =
    open && effectiveHighlightedIndex >= 0 && visibleOptions[effectiveHighlightedIndex]
      ? `${baseId}-opt-${effectiveHighlightedIndex}`
      : undefined;

  // Count non-pinned rows separately so pinned fallback items get a visual divider only when shown below other rows.
  const regularCount = visibleOptions.filter((o) => !pinnedSet.has(o.value)).length;
  const searchHeaderReserve = searchable ? 54 : 12;
  const listMaxHeight = placement ? Math.max(96, placement.maxHeight - searchHeaderReserve) : 240;

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? closeMenu(true) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        onBlur={handleTriggerBlur}
        className={cn(
          controlClasses,
          "flex h-12 items-center justify-between gap-3 px-4 text-left",
          open && "bg-deep ring-2 ring-aqua",
          className,
        )}
      >
        <span className={cn("min-w-0 truncate", isPlaceholder ? "text-haze" : "text-foam")}>
          {selectedOption?.label ?? ""}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 text-haze transition-transform duration-200 ease-out-quart motion-reduce:transition-none",
            open && "rotate-180 text-aqua",
          )}
        />
      </button>

      {open &&
        portalTarget &&
        placement &&
        createPortal(
          <div
            ref={menuRef}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onBlur={handleMenuBlur}
            style={{
              left: placement.left,
              width: placement.width,
              ...(placement.top !== undefined ? { top: placement.top } : {}),
              ...(placement.bottom !== undefined ? { bottom: placement.bottom } : {}),
            }}
            className={cn(
              insideDialog ? "absolute z-tooltip" : "fixed z-dropdown",
              "rounded-panel border border-edge bg-night p-1.5 font-body text-foam shadow-lift",
              !reduceMotion && "transition-opacity duration-150 ease-out-quart",
            )}
          >
            {searchable && (
              <div className="mb-1 border-b border-ocean/70 pb-1.5">
                <div className="relative flex items-center">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 size-4 text-haze"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    inputMode="search"
                    value={query}
                    onChange={(e) => updateSearchQuery(e.target.value)}
                    onKeyDown={handleMenuKeyDown}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    aria-controls={listboxId}
                    aria-activedescendant={activeOptionId}
                    className="h-10 w-full rounded-control bg-deep/75 pr-8 pl-9 text-small text-foam ring-1 ring-edge/60 ring-inset placeholder:text-haze focus-visible:ring-2 focus-visible:ring-aqua focus-visible:outline-hidden"
                  />
                  {query.length > 0 && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        updateSearchQuery("");
                        searchInputRef.current?.focus({ preventScroll: true });
                      }}
                      className="absolute right-1.5 grid size-7 place-items-center rounded-full text-haze hover:bg-ocean/60 hover:text-foam focus-visible:outline-2 focus-visible:outline-aqua"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              tabIndex={searchable ? -1 : 0}
              aria-activedescendant={activeOptionId}
              onKeyDown={searchable ? undefined : handleMenuKeyDown}
              style={{ maxHeight: listMaxHeight }}
              className="aurora-scroll flex flex-col gap-0.5 overflow-y-auto overscroll-contain focus:outline-hidden"
            >
              {visibleOptions.length === 0 || (query.trim().length > 0 && regularCount === 0 && pinnedSet.size === 0) ? (
                <p className="px-3 py-3 text-center text-small text-haze">{emptyMessage}</p>
              ) : (
                visibleOptions.map((option, idx) => {
                  const selected = option.value === currentValue;
                  const highlighted = idx === effectiveHighlightedIndex;
                  const isFirstPinnedAfterList =
                    pinnedSet.has(option.value) &&
                    regularCount > 0 &&
                    (idx === 0 || !pinnedSet.has(visibleOptions[idx - 1]?.value ?? ""));

                  return (
                    <Fragment key={`${option.value}-${idx}`}>
                      {isFirstPinnedAfterList && (
                        <div role="separator" className="my-1 border-t border-ocean/70" />
                      )}
                      {query.trim().length > 0 && regularCount === 0 && isFirstPinnedAfterList === false && idx === 0 && pinnedSet.has(option.value) && (
                        <p className="px-3 py-1.5 text-caption text-haze">
                          No listed university matched &ldquo;{query.trim()}&rdquo;
                        </p>
                      )}
                      <div
                        ref={(el) => {
                          optionRefs.current[idx] = el;
                        }}
                        id={`${baseId}-opt-${idx}`}
                        role="option"
                        aria-selected={selected}
                        aria-disabled={option.disabled || undefined}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => {
                          if (!option.disabled) setHighlightedIndex(idx);
                        }}
                        onClick={() => {
                          if (!option.disabled) commitValue(option.value);
                        }}
                        className={cn(
                          "flex min-h-11 sm:min-h-10 w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left text-small select-none transition-colors duration-150 motion-reduce:transition-none",
                          option.disabled
                            ? "cursor-not-allowed opacity-45"
                            : "cursor-pointer",
                          selected
                            ? "bg-deep font-medium text-aqua"
                            : highlighted
                              ? "bg-ocean/60 text-foam"
                              : option.value === ""
                                ? "text-haze"
                                : "text-foam",
                        )}
                      >
                        <span className="min-w-0 leading-snug">{option.label}</span>
                        {selected && <Check aria-hidden="true" className="size-4 shrink-0 text-mint" />}
                      </div>
                    </Fragment>
                  );
                })
              )}
            </div>
          </div>,
          portalTarget,
        )}
    </div>
  );
}
