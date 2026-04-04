import { formatCurrency } from "./constants";

const MASK = "*****";

export function maskAmount(amount: number, privacyMode: boolean): string {
  return privacyMode ? MASK : formatCurrency(amount);
}

export function maskText(text: string, privacyMode: boolean): string {
  return privacyMode ? MASK : text;
}
