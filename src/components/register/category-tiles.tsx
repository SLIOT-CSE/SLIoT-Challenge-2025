import { categories } from "@/content/categories";
import type { CategoryId } from "@/lib/team-rules";
import { cn } from "@/lib/utils";

/** Three large selectable tiles, each with the category's rules in a line each */
export function CategoryTiles({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: "" | CategoryId;
  onChange: (id: CategoryId) => void;
  onBlur: () => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? "category-error" : undefined}>
      <legend className="mb-3 text-small font-semibold text-foam">Category</legend>
      <div className="grid gap-3 md:grid-cols-3">
        {categories.map((c) => {
          const selected = value === c.id;
          return (
            <label
              key={c.id}
              className={cn(
                "relative flex cursor-pointer flex-col gap-3 rounded-panel p-5 ring-1 ring-inset transition-[background-color,box-shadow] duration-200 ease-out-quart motion-reduce:transition-none",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mint",
                selected ? "bg-mint/10 ring-2 ring-mint" : "bg-deep/40 ring-edge hover:ring-lagoon",
                error && !selected && "ring-danger",
              )}
            >
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={selected}
                onChange={() => onChange(c.id)}
                onBlur={onBlur}
                data-invalid={error ? true : undefined}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0 font-display text-[1.75rem] leading-none text-foam">{c.name}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                    selected ? "bg-mint ring-mint" : "ring-edge",
                  )}
                >
                  {selected && <span className="size-2 rounded-full bg-abyss" />}
                </span>
              </span>
              <span className="text-small text-haze">{c.summary}</span>
              <ul className="flex flex-col gap-1.5 text-caption text-foam/90">
                {c.rules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-mint" />
                    {rule}
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </div>
      <p id="category-error" aria-live="polite" className={cn("mt-2 text-caption text-danger", !error && "sr-only")}>
        {error}
      </p>
    </fieldset>
  );
}
