import { TOPIC_COLORS, TOPIC_LABELS } from "@/lib/content/topic-meta";
import type { Topic } from "@/lib/content/types";

const COLOR_CLASSES = {
  alert: "text-alert",
  amber: "text-amber-ink",
  teal: "text-teal",
} as const;

export function TopicLabel({ topic }: { topic: Topic }) {
  return (
    <span
      className={`font-mono text-xs uppercase tracking-wide ${COLOR_CLASSES[TOPIC_COLORS[topic]]}`}
    >
      {TOPIC_LABELS[topic]}
    </span>
  );
}
