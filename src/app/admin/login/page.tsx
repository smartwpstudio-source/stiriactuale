import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin/");
  const { e } = await searchParams;

  return (
    <form action={loginAction} className="mx-auto mt-24 flex max-w-xs flex-col gap-3">
      <h1 className="font-serif text-2xl text-ink">Stiri actuale — admin</h1>
      <label className="text-sm text-sub" htmlFor="password">
        Parola
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="rounded border border-line bg-white px-3 py-2 text-ink"
      />
      {e && <p className="text-sm text-alert">Parolă greșită.</p>}
      <button className="rounded bg-ink px-3 py-2 text-white">Intră</button>
    </form>
  );
}
