import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CALENDAR_PATH, FIRST_YEAR, LAST_YEAR, OrthodoxCalendar } from "@/components/orthodox-calendar";

export const revalidate = 3600;

const parseYear = (an: string) => {
  const y = Number(an);
  return Number.isInteger(y) && y >= FIRST_YEAR && y <= LAST_YEAR && String(y) === an ? y : null;
};

export async function generateMetadata({ params }: PageProps<"/calendar-crestin-ortodox/[an]">): Promise<Metadata> {
  const y = parseYear((await params).an);
  return y
    ? {
        title: `Calendar ortodox ${y}: Paștele, sărbători și posturi`,
        description: `Calendarul creștin-ortodox ${y} pe stil vechi și stil nou: când e Paștele ${y}, sărbătorile mari, posturile și sfinții pe zile.`,
        alternates: { canonical: `${CALENDAR_PATH}${y}/` },
      }
    : {};
}

export default async function CalendarYearPage({ params, searchParams }: PageProps<"/calendar-crestin-ortodox/[an]">) {
  const y = parseYear((await params).an);
  if (!y) notFound();
  const style = (await searchParams).stil === "nou" ? "nou" : "vechi";
  return <OrthodoxCalendar year={y} style={style} basePath={`${CALENDAR_PATH}${y}/`} />;
}
