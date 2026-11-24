"use client";

import { useState, type ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmByTyping } from "@/components/ui/confirm-by-typing";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { PasswordReveal, type PasswordRevealValue } from "@/components/ui/password-reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { generatePassword } from "@/lib/admin-password";

export function AdminUiGallery() {
  return (
    <ToastProvider>
      <Gallery />
    </ToastProvider>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Gallery() {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [drawerDirty, setDrawerDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [reveal, setReveal] = useState<PasswordRevealValue | null>(null);
  const [ticks, setTicks] = useState([true, false, false]);

  const allTicked = ticks.every(Boolean) ? true : ticks.some(Boolean) ? "indeterminate" : false;

  return (
    <>
      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Registered</Badge>
          <Badge tone="mint">Shortlisted</Badge>
          <Badge tone="aqua" dot>
            Finalist
          </Badge>
          <Badge tone="warning">Draft</Badge>
          <Badge tone="danger">Disabled</Badge>
        </div>
      </Section>

      <Section title="Checkbox">
        <div className="flex flex-col">
          <label className="flex items-center gap-1 text-small">
            <Checkbox
              checked={allTicked}
              onCheckedChange={(on) => setTicks(ticks.map(() => on))}
              aria-label="Select all teams"
            />
            Select all (indeterminate while some are ticked)
          </label>
          {ticks.map((on, i) => (
            <label key={i} className="flex items-center gap-1 pl-8 text-small">
              <Checkbox
                checked={on}
                onCheckedChange={(next) => setTicks(ticks.map((t, j) => (j === i ? next : t)))}
                aria-label={`Team ${i + 1}`}
              />
              Team {i + 1}
            </label>
          ))}
          <label className="flex items-center gap-1 text-small text-haze">
            <Checkbox checked={true} onCheckedChange={() => undefined} disabled aria-label="Locked team" />
            Disabled, ticked (the shortlist while finalised)
          </label>
        </div>
      </Section>

      <Section title="Skeleton and empty state">
        <div aria-busy="true" aria-label="Loading teams" className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </div>
        <EmptyState
          icon={<SearchX />}
          title="No teams match"
          description="Nothing matches that search and those filters. Try fewer filters, or search by a team code."
          action={<Button variant="secondary">Clear filters</Button>}
        />
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => toast({ tone: "success", title: "Shortlist finalised", description: "12 teams emailed." })}
          >
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast({ tone: "info", title: "Exported to Sheets" })}>
            Info
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({ tone: "error", title: "Couldn't save", description: "Check your connection and try again." })
            }
          >
            Error
          </Button>
        </div>
      </Section>

      <Section title="Dialog, drawer and confirmations">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setDialog(true)}>
            Dialog
          </Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            Drawer (guards unsaved changes)
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setAttempts(0);
              setConfirm(true);
            }}
          >
            Confirm by typing
          </Button>
          <Button variant="secondary" onClick={() => setReveal({ title: "Password for Sample Admin One", password: generatePassword() })}>
            Password reveal
          </Button>
        </div>
      </Section>

      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title="Reopen the shortlist?"
        description="Teams keep their published result until you finalise again."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialog(false)}>Reopen shortlist</Button>
          </>
        }
      >
        <p className="text-small text-haze">The ticks become editable. Nobody is emailed until you finalise.</p>
      </Dialog>

      <Drawer
        open={drawer}
        // Closing with unsaved changes asks first, as the team drawer does
        onOpenChange={(open) => {
          if (!open && drawerDirty) setConfirmDiscard(true);
          else setDrawer(open);
        }}
        title="Wave Riders"
        description="SL27-7KQ4-M9XD · School"
        footer={
          <Button
            onClick={() => {
              setDrawerDirty(false);
              toast({ tone: "success", title: "Changes saved" });
            }}
            disabled={!drawerDirty}
          >
            Save changes
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-small text-haze">Edit something, then try to close: the drawer asks first.</p>
          <Button variant="secondary" onClick={() => setDrawerDirty(true)}>
            Make a change
          </Button>
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i} className="text-small text-haze">
              Scrolling content line {i + 1}
            </p>
          ))}
        </div>
      </Drawer>

      <Dialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard your changes?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDiscard(false)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmDiscard(false);
                setDrawerDirty(false);
                setDrawer(false);
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        <p className="text-small text-haze">You have edits that haven&apos;t been saved.</p>
      </Dialog>

      <ConfirmByTyping
        open={confirm}
        onOpenChange={setConfirm}
        word="FINALISE"
        title="Finalise the shortlist?"
        description="This will email 12 teams and open prototype submission for them."
        confirmLabel="Finalise shortlist"
        onConfirm={async () => {
          await new Promise((resolve) => setTimeout(resolve, 800));
          // The first try fails, to show the error state
          if (attempts === 0) {
            setAttempts(1);
            return "Couldn't finalise the shortlist. Try again.";
          }
          toast({ tone: "success", title: "Shortlist finalised", description: "12 teams emailed." });
        }}
      />

      <PasswordReveal reveal={reveal} onClose={() => setReveal(null)} />
    </>
  );
}
