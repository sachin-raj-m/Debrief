/**
 * Home Page
 * 
 * Main feed showing ideas list with sort dropdown.
 */

"use client";

import { useState } from "react";
import { Header } from "@/components/layout";
import { IdeasList, SortDropdown, type SortOption } from "@/components/ideas";

export default function HomePage() {
  const [sort, setSort] = useState<SortOption>("votes_desc");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1600px] px-4 md:px-8 pt-24 md:pt-32 pb-12">
        {/* <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground mb-4 drop-shadow-sm">Debrief</h1>
            <p className="font-sans text-lg text-muted-foreground/80 max-w-2xl leading-relaxed">
              Validate, refine, and prove your ideas with instant feedback from real users.
            </p>
          </div>
        </div> */}

        <div className="flex justify-end mb-4">
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        <IdeasList sort={sort} />
      </main>
    </>
  );
}
