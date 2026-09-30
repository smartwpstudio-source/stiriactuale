import { Breadcrumb } from "./breadcrumb";

// Cadru pentru paginile de informare (Despre, Contact, politici).
export function StaticPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[640px] px-4 py-8">
      <Breadcrumb items={[{ label: "Acasă", href: "/" }, { label: title }]} />
      <h1 className="mt-2 font-serif text-3xl text-ink">{title}</h1>
      {updated && <p className="mt-2 font-mono text-xs text-sub">Actualizat: {updated}</p>}
      <div className="prose-article mt-4 text-ink">{children}</div>
    </article>
  );
}

// Email-ul de contact, sau o notă vizibilă cât timp nu e completat în site-info.ts.
export function ContactEmail({ email }: { email: string | null }) {
  return email ? <a href={`mailto:${email}`}>{email}</a> : <strong>[email de contact — de completat]</strong>;
}
