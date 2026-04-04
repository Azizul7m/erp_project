import Link from "next/link";
import { cookies } from "next/headers";

export default async function Home() {
  const store = await cookies();
  const token = store.get("erp_token")?.value;

  const primaryHref = token ? "/dashboard" : "/login";
  const primaryLabel = token ? "Open dashboard" : "Sign in";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                ERP Project
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Next.js, Go Echo, PostgreSQL
              </p>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                href={primaryHref}
                className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {primaryLabel}
              </Link>
            </nav>
          </header>

          <div className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
                Modular ERP for customer, product, order, and transaction workflows
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Manage your ERP defense project from one clean control center.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Track customers, products, orders, and financial activity with a
                simple full-stack workflow built for demonstration, clarity, and
                working functionality.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={primaryHref}
                  className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                >
                  View dashboard route
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-cyan-300">5</p>
                  <p className="mt-1 text-sm text-slate-300">Core modules</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-emerald-300">REST</p>
                  <p className="mt-1 text-sm text-slate-300">API-driven workflow</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-2xl font-semibold text-amber-300">JWT</p>
                  <p className="mt-1 text-sm text-slate-300">Protected app routes</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">ERP overview</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">
                      Business snapshot
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
                    Demo ready
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    ["Customers", "Maintain contact, phone, email, and address records."],
                    ["Products", "Track price, stock, and product catalog data."],
                    ["Orders", "Create orders, add items, and calculate totals."],
                    ["Transactions", "Record income and expense activity."],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/10 bg-slate-800/70 p-4"
                    >
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-3 lg:px-10">
          {[
            {
              title: "Dashboard insights",
              text: "Show total customers, products, orders, and revenue in one summary view.",
            },
            {
              title: "Operational modules",
              text: "Use focused CRUD pages for customers, products, orders, and transactions.",
            },
            {
              title: "Clean architecture",
              text: "Separate frontend, API, and database layers to support clear defense discussion.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-slate-950/60 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
