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
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Debrief</h1>
          <p className="font-sans text-base text-muted-foreground">Validate, refine, and prove your ideas.</p>
        </div>

        <div className="flex justify-end mb-4">
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        <IdeasList sort={sort} />
      </main>
    </>
  );
}
