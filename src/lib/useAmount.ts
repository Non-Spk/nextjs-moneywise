"use client";

import { useTheme } from "@/components/ThemeProvider";
import { formatCurrency } from "./constants";

const MASK = "*****";

export function useAmount() {
  const { privacyMode } = useTheme();
  return (amount: number) => privacyMode ? MASK : formatCurrency(amount);
}
