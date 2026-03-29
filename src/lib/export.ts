export async function exportToExcel(
  type: string,
  params?: Record<string, string>
) {
  const query = new URLSearchParams({ type, ...params });
  // Remove empty params
  for (const [key, val] of query.entries()) {
    if (!val) query.delete(key);
  }

  const res = await fetch(`/api/export?${query}`);
  if (!res.ok) return;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    res.headers
      .get("Content-Disposition")
      ?.match(/filename="(.+)"/)?.[1] || `moneywise-${type}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
