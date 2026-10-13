"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/pipeline/db/client";
import { utilPlan } from "@/lib/pipeline/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { dispatchPipeline } from "@/lib/pipeline-dispatch";
import { requestPlan, requestWrite, UTIL_TYPES } from "@/lib/pipeline/util-plan";
import { RAION_NAMES } from "@/lib/content/geo";

// Planul rubricii Util (src/lib/pipeline/util.ts), din /admin/util/.

export async function setUtilStatus(id: number, status: "aprobat" | "respins" | "propus") {
  await requireAdmin();
  await getDb().update(utilPlan).set({ status }).where(eq(utilPlan.id, id));
  redirect("/admin/util/");
}

export async function approveDay(day: string) {
  await requireAdmin();
  const db = getDb();
  const rows = await db.select().from(utilPlan).where(eq(utilPlan.day, day));
  for (const r of rows) if (r.status === "propus") await db.update(utilPlan).set({ status: "aprobat" }).where(eq(utilPlan.id, r.id));
  redirect("/admin/util/");
}

export async function addUtilTopic(formData: FormData) {
  await requireAdmin();
  const day = String(formData.get("day") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const type = String(formData.get("type") ?? "unealta");
  const tools = String(formData.get("tools") ?? "")
    .split(/[\s,]+/)
    .filter((t) => /^(ghid|calc|model|reteta):[a-z0-9-]+$/.test(t));
  const locality = String(formData.get("locality") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !topic || !(type in UTIL_TYPES) || !tools.length) redirect("/admin/util/?err=1");
  await getDb()
    .insert(utilPlan)
    .values({
      day,
      type,
      topic: topic.slice(0, 300),
      angle: String(formData.get("angle") ?? "").trim().slice(0, 2000) || topic,
      tools,
      locality: locality in RAION_NAMES ? locality : null,
      status: "aprobat",
    });
  redirect("/admin/util/");
}

// Planul cerut acum: pipeline-ul îl face la rularea pornită de buton (2-5 minute)
export async function planNow() {
  await requireAdmin();
  await requestPlan();
  const { ok } = await dispatchPipeline();
  redirect(ok ? "/admin/util/?run=plan" : "/admin/util/?run=fail");
}

export async function writeNow(id: number) {
  await requireAdmin();
  await requestWrite(id);
  const { ok } = await dispatchPipeline();
  redirect(ok ? "/admin/util/?run=write" : "/admin/util/?run=fail");
}
