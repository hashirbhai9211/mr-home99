export function normalizeWhatsAppNumber(n: string) {
  return (n || "").replace(/[^\d]/g, "");
}

export function fillTemplate(template: string, vars: Record<string, string | undefined | null>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => (vars[k] ?? "").toString());
}

export function buildWhatsAppLink(number: string, message: string) {
  const digits = normalizeWhatsAppNumber(number);
  const text = encodeURIComponent(message);
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function telLink(phone: string) {
  return `tel:${(phone || "").replace(/[^+\d]/g, "")}`;
}
