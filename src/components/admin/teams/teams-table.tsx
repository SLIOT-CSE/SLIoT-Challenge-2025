"use client";

import { Fragment, useMemo, useState } from "react";
import {
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, TeamRow } from "@/lib/data";
import { formatWhatsappDisplay } from "@/lib/member-display";
import { CATEGORY_LABELS, TEAM_STAGES } from "@/lib/team-rules";
import { cn } from "@/lib/utils";
import { StageBadge } from "../badges";
import { formatShortDay } from "../format";
import { TEAM_COLUMNS, type ColumnVisibility } from "./columns-config";

// The Teams table. TanStack Table sorts and hides columns; the screen filters before the rows
// get here, and the markup (sticky header, expandable member rows) is ours.

const features = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic, text: sortFn_text },
});

const helper = createColumnHelper<typeof features, TeamRow>();

const stageOrder = (row: TeamRow) => TEAM_STAGES.indexOf(row.stage);
const leaderOf = (row: TeamRow): Member | undefined => row.members[0];

/** The institution as one line: the team's own, or a note for Open teams where each member has theirs */
export function institutionLabel(row: TeamRow): string {
  if (row.institutionName) return row.institutionName;
  return row.category === "open" ? "Each member's own" : "—";
}

export function useTeamsTable({
  data,
  columnVisibility,
  onOpen,
}: {
  data: TeamRow[];
  columnVisibility: ColumnVisibility;
  onOpen: (team: TeamRow) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((row) => row.name, {
          id: "name",
          header: "Team",
          sortFn: "text",
          enableHiding: false,
          cell: ({ row }) => (
            <button
              type="button"
              onClick={() => onOpen(row.original)}
              className="rounded-control py-2 text-left font-semibold whitespace-nowrap text-foam hover:text-aqua hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
            >
              {row.original.name}
              <span className="sr-only">, open team details</span>
            </button>
          ),
        }),
        helper.accessor((row) => row.code, {
          id: "code",
          header: "Code",
          sortFn: "text",
          cell: ({ row }) => <code className="font-mono text-caption text-haze">{row.original.code}</code>,
        }),
        helper.accessor((row) => CATEGORY_LABELS[row.category], {
          id: "category",
          header: "Category",
          sortFn: "text",
          cell: ({ getValue }) => getValue(),
        }),
        helper.accessor((row) => stageOrder(row), {
          id: "stage",
          header: "Stage",
          sortFn: "basic",
          cell: ({ row }) => <StageBadge stage={row.original.stage} />,
        }),
        helper.accessor((row) => institutionLabel(row), {
          id: "institution",
          header: "Institution",
          sortFn: "text",
          cell: ({ getValue }) => <span className="block max-w-64 truncate" title={getValue()}>{getValue()}</span>,
        }),
        helper.accessor((row) => leaderOf(row)?.fullName ?? "", {
          id: "leader",
          header: "Team leader",
          sortFn: "text",
          cell: ({ getValue }) => getValue() || "—",
        }),
        helper.accessor((row) => leaderOf(row)?.email ?? "", {
          id: "leaderEmail",
          header: "Leader's email",
          sortFn: "text",
          cell: ({ getValue }) => <span className="block max-w-56 truncate">{getValue() || "—"}</span>,
        }),
        helper.accessor((row) => row.members.length, {
          id: "members",
          header: "Members",
          sortFn: "basic",
          cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
        }),
        helper.accessor((row) => row.proposal?.version ?? 0, {
          id: "proposal",
          header: "Proposal",
          sortFn: "basic",
          cell: ({ row }) =>
            row.original.proposal ? (
              <span>
                v{row.original.proposal.version}
                <span className="text-haze"> · {formatShortDay(row.original.proposal.submittedAt)}</span>
              </span>
            ) : (
              <span className="text-haze">None yet</span>
            ),
        }),
        helper.accessor((row) => (row.prototype ? 1 : 0), {
          id: "prototype",
          header: "Prototype",
          sortFn: "basic",
          cell: ({ row }) =>
            row.original.prototype ? <span>Submitted</span> : <span className="text-haze">None yet</span>,
        }),
        helper.accessor((row) => row.createdAt, {
          id: "registered",
          header: "Registered",
          sortFn: "basic",
          cell: ({ getValue }) => formatShortDay(getValue()),
        }),
      ]),
    [onOpen],
  );

  return useTable({
    features,
    columns,
    data,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    // The screen owns visibility (it saves the choice); the table only reads it
    onColumnVisibilityChange: () => undefined,
  });
}

export type TeamsTableInstance = ReturnType<typeof useTeamsTable>;

const COLUMN_LABEL = Object.fromEntries(TEAM_COLUMNS.map((c) => [c.id, c.label]));

export function TeamsTable({
  table,
  expanded,
  onToggle,
}: {
  table: TeamsTableInstance;
  expanded: ReadonlySet<number>;
  onToggle: (teamId: number) => void;
}) {
  const rows = table.getRowModel().rows;
  const visibleCount = table.getVisibleLeafColumns().length + 1;

  return (
    <div className="relative max-h-[calc(100dvh-19rem)] min-h-64 overflow-auto rounded-panel ring-1 ring-edge ring-inset">
      <table className="w-full border-separate border-spacing-0 text-small">
        <caption className="sr-only">Teams. Select a column heading to sort by it.</caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              <th scope="col" className="sticky top-0 z-10 w-12 border-b border-edge bg-night px-2 py-2">
                <span className="sr-only">Show members</span>
              </th>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const label = COLUMN_LABEL[header.column.id] ?? header.column.id;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    className="sticky top-0 z-10 border-b border-edge bg-night p-0 text-left"
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-1.5 px-3 text-left font-semibold whitespace-nowrap hover:text-foam focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-aqua",
                        sorted ? "text-foam" : "text-haze",
                      )}
                    >
                      {label}
                      {sorted === "asc" ? (
                        <ArrowUp aria-hidden="true" className="size-4 text-aqua" />
                      ) : sorted === "desc" ? (
                        <ArrowDown aria-hidden="true" className="size-4 text-aqua" />
                      ) : (
                        <ArrowUpDown aria-hidden="true" className="size-4 opacity-50" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => {
            const open = expanded.has(row.original.id);
            const panelId = `members-${row.original.id}`;
            return (
              <Fragment key={row.id}>
                <tr className="hover:bg-foam/5">
                  <td className="border-b border-edge/60 px-2">
                    <button
                      type="button"
                      onClick={() => onToggle(row.original.id)}
                      aria-expanded={open}
                      aria-controls={open ? panelId : undefined}
                      aria-label={`${open ? "Hide" : "Show"} members of ${row.original.name}`}
                      className="grid size-11 place-items-center rounded-full text-haze hover:bg-foam/10 hover:text-foam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua"
                    >
                      <ChevronRight
                        aria-hidden="true"
                        className={cn("size-5 transition-transform motion-reduce:transition-none", open && "rotate-90")}
                      />
                    </button>
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border-b border-edge/60 px-3 py-1 align-middle whitespace-nowrap text-foam">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
                {open && (
                  <tr id={panelId}>
                    <td colSpan={visibleCount} className="border-b border-edge/60 bg-deep/40 p-0">
                      {/* Stays at the visible edge while the table scrolls sideways (page padding and sidebar subtracted) */}
                      <div className="sticky left-0 w-[calc(100vw-2.5rem)] sm:w-[calc(100vw-4.5rem)] lg:w-[calc(100vw-20.5rem)]">
                        <MemberList team={row.original} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MemberList({ team }: { team: TeamRow }) {
  return (
    <ul aria-label={`Members of ${team.name}`} className="grid gap-x-8 gap-y-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-3">
      {team.members.map((m) => (
        <li key={m.id} className="flex min-w-0 flex-col gap-2 text-small">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 wrap-break-word font-semibold text-foam">{m.fullName}</span>
            {m.position === 1 && (
              <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-caption font-semibold text-mint ring-1 ring-mint/30 ring-inset">
                Team leader
              </span>
            )}
          </div>
          <dl className="grid grid-cols-1 gap-y-1.5">
            <div className="min-w-0">
              <dt className="text-caption font-medium text-haze">Email</dt>
              <dd className="break-all text-foam">{m.email}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-caption font-medium text-haze">WhatsApp</dt>
              <dd className="tabular-nums text-foam">{formatWhatsappDisplay(m.whatsapp)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-caption font-medium text-haze">Institution</dt>
              <dd className="wrap-break-word text-foam">{m.institutionName}</dd>
            </div>
            {m.nic && (
              <div className="min-w-0">
                <dt className="text-caption font-medium text-haze">NIC</dt>
                <dd className="font-mono tabular-nums text-foam">{m.nic}</dd>
              </div>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}

/** The shape of the table while it loads */
export function TeamsTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading teams" role="status" className="flex flex-col gap-px overflow-hidden rounded-panel ring-1 ring-edge ring-inset">
      <Skeleton className="h-11 w-full rounded-none bg-night" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-none" />
      ))}
    </div>
  );
}
