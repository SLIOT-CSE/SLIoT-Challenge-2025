"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TEAM_COLUMNS, defaultVisibility, type ColumnVisibility } from "./columns-config";

/**
 * "Columns": a small panel of checkboxes. Esc or a click outside closes it (focus goes back to
 * the button), and the choice is the screen's to save.
 */
export function ColumnPicker({
  visibility,
  onChange,
}: {
  visibility: ColumnVisibility;
  onChange: (next: ColumnVisibility) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const shown = TEAM_COLUMNS.filter((c) => visibility[c.id] !== false).length;

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={buttonRef}
        variant="secondary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <Columns3 aria-hidden="true" className="size-4" />
        Columns
        <span className="text-haze">
          {shown}/{TEAM_COLUMNS.length}
        </span>
      </Button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Choose columns"
          className="absolute right-0 z-dropdown mt-2 flex w-64 flex-col gap-1 rounded-panel border border-ocean bg-night p-2 shadow-lift"
        >
          {TEAM_COLUMNS.map((column) => (
            <label key={column.id} className="flex items-center gap-1 text-small text-foam has-[:disabled]:text-haze">
              <Checkbox
                checked={visibility[column.id] !== false}
                disabled={!column.hideable}
                onCheckedChange={(on) => onChange({ ...visibility, [column.id]: on })}
              />
              {column.label}
              {!column.hideable && <span className="text-caption text-haze">(always shown)</span>}
            </label>
          ))}
          <Button variant="ghost" size="sm" className="mt-1 self-start" onClick={() => onChange(defaultVisibility())}>
            Reset columns
          </Button>
        </div>
      )}
    </div>
  );
}
