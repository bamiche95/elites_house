/** FormData helpers shared by admin server actions. */

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formOptional(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value || undefined;
}

export function formInt(formData: FormData, key: string, fallback = 0) {
  const value = Number(formString(formData, key));
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

export function formPence(formData: FormData, key: string) {
  const value = Number(formString(formData, key));
  return Number.isFinite(value) ? Math.max(0, Math.round(value * 100)) : 0;
}

export function formBool(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function formIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}
