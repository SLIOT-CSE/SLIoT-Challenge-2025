"use client";

import { ModalShell, type OverlayProps } from "./overlay";

/**
 * A side panel that slides in from the right (full width on phones), for details that sit
 * over a list, like a team over the teams table.
 */
export function Drawer(props: OverlayProps) {
  return <ModalShell variant="drawer" {...props} />;
}
