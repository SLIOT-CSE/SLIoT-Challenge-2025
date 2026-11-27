import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * What this is, why it's empty and what to do next (docs/frontend-plan.md, section 7).
 *   <EmptyState title="No teams match" description="Try a different search." action={<Button>Clear filters</Button>} />
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-panel border border-dashed border-ocean px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div aria-hidden="true" className="text-lagoon [&>svg]:size-8">
          {icon}
        </div>
      )}
      <p className="font-body text-body-lg font-semibold text-foam">{title}</p>
      {description && <p className="max-w-prose font-body text-small text-haze">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
