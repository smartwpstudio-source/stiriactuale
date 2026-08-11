export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-paper">
      <div className="mx-auto max-w-5xl px-4 py-8 font-mono text-[11px] text-paper/70">
        © {new Date().getFullYear()} Stiri actuale
      </div>
    </footer>
  );
}
