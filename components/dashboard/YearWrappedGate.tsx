"use client";

import React, { useEffect, useState } from "react";
import { YearWrappedModal } from "@/components/dashboard/YearWrappedModal";
import { currentYear, today } from "@/lib/utils";
import { isYearEndDay, YEAR_WRAPPED_KEY } from "@/lib/year-wrapped";

export function YearWrappedGate() {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const todayStr = today();
    if (!isYearEndDay(todayStr)) return;

    const wrappedYear = currentYear();
    if (localStorage.getItem(YEAR_WRAPPED_KEY(wrappedYear)) === "1") return;

    setYear(wrappedYear);
    setOpen(true);
  }, []);

  function handleClose() {
    if (year !== null) {
      localStorage.setItem(YEAR_WRAPPED_KEY(year), "1");
    }
    setOpen(false);
  }

  if (year === null) return null;

  return (
    <YearWrappedModal year={year} open={open} onClose={handleClose} />
  );
}
