"use client";

import { ModalShell, type OverlayProps } from "./overlay";

/**
 * A centred dialog for a short decision or a short form.
 *   <Dialog open={open} onOpenChange={setOpen} title="Reopen the shortlist?" footer={<Button>Reopen</Button>}>…</Dialog>
 */
export function Dialog(props: OverlayProps) {
  return <ModalShell variant="dialog" {...props} />;
}
