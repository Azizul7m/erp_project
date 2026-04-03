import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <main className="max-w-4xl w-full bg-white shadow-lg rounded-xl border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/next.svg" alt="Next.js" width={100} height={40} priority />
          <h1 className="text-2xl font-bold text-slate-800">Tailwind is configured.</h1>
        </div>
        <p className="text-slate-600 mb-5">
          Tailwind CSS is now enabled. Open <code className="rounded bg-slate-100 px-1 py-0.5">src/app/page.js</code> to start editing.
        </p>

        <div className="flex gap-2">
          <a
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            href="https://tailwindcss.com/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tailwind Docs
          </a>
          <a
            className="px-4 py-2 bg-gray-200 text-slate-700 rounded-lg hover:bg-gray-300"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Docs
        </div>
      </main>
    </div>
  );
}
