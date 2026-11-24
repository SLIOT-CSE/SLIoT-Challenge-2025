import { Badge, type BadgeProps } from "@/components/ui/badge";
import { CATEGORY_LABELS, TEAM_STAGE_LABELS, type CategoryId, type TeamStage } from "@/lib/team-rules";

const STAGE_TONE: Record<TeamStage, NonNullable<BadgeProps["tone"]>> = {
  registered: "neutral",
  proposal_submitted: "neutral",
  shortlisted: "mint",
  not_shortlisted: "warning",
  prototype_submitted: "mint",
  finalist: "aqua",
};

/** A team's stage in words, coloured so a column of them can be scanned */
export function StageBadge({ stage }: { stage: TeamStage }) {
  return (
    <Badge tone={STAGE_TONE[stage]} dot={stage === "finalist"}>
      {TEAM_STAGE_LABELS[stage]}
    </Badge>
  );
}

export function CategoryText({ category }: { category: CategoryId }) {
  return <>{CATEGORY_LABELS[category]}</>;
}
