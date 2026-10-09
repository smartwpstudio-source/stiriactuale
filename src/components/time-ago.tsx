"use client";

import { useSyncExternalStore } from "react";
import { formatTimeAgo } from "@/lib/format-time-ago";

// „acum 13 min” calculat în browser: paginile stau în cache ore întregi, iar pe
// server textul ar îngheța. Serverul (și cache-ul) pun data și ora exactă.
const noop = () => () => {};

export function TimeAgo({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noop,
    () => formatTimeAgo(iso),
    () =>
      new Date(iso).toLocaleString("ro-MD", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Chisinau" }),
  );
  return <time dateTime={iso}>{text}</time>;
}
