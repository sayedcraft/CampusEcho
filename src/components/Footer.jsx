import Link from "next/link";
import { ArrowUp, Megaphone } from "lucide-react";

export default function Footer({ language = "en" }) {
  const isBengali = language === "bn";

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-center lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Megaphone aria-hidden="true" className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              CampusEcho
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            {isBengali
              ? "ক্যাম্পাসের সমস্যা জানান, আপডেট অনুসরণ করুন এবং একসাথে উন্নত ক্যাম্পাস গড়ুন।"
              : "A shared space to report campus issues, follow updates, and make IIUC a better place together."}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:col-span-1">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isBengali ? "আপনার ক্যাম্পাস, আপনার কণ্ঠ" : "Your campus. Your voice."}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isBengali
                ? "IIUC কুমিরা ক্যাম্পাস কমিউনিটির জন্য তৈরি"
                : "Made for the IIUC Kumira campus community"}
            </p>
          </div>
          <Link
            href="#top"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-white sm:self-auto"
          >
            {isBengali ? "উপরে যান" : "Back to top"}
            <ArrowUp aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <p>
            © CampusEcho
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">
              {isBengali
                ? "IIUC কুমিরা ক্যাম্পাস"
                : "IIUC Kumira Campus"}
            </span>
          </p>
          <p>
            {isBengali
              ? "ক্যাম্পাস কমিউনিটির জন্য তৈরি"
              : "Built for the campus community"}
          </p>
        </div>
      </div>
    </footer>
  );
}
