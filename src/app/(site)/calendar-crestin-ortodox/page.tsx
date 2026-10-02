import type { Metadata } from "next";
import { CALENDAR_PATH, OrthodoxCalendar, todayChisinau } from "@/components/orthodox-calendar";

// Pilonul: adresă permanentă, conținut pentru anul curent (trece singur la anul nou).
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const y = todayChisinau().getUTCFullYear();
  return {
    title: `Calendar creștin-ortodox ${y}: sărbători, posturi, Paștele`,
    description: `Calendarul ortodox ${y} pe stil vechi și stil nou: data Paștelui, sărbătorile mari, posturile și sfinții fiecărei zile.`,
    alternates: { canonical: CALENDAR_PATH },
  };
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar-crestin-ortodox">) {
  const style = (await searchParams).stil === "nou" ? "nou" : "vechi";
  return <OrthodoxCalendar year={todayChisinau().getUTCFullYear()} style={style} basePath={CALENDAR_PATH} />;
}
