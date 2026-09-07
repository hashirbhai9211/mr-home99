import type { ReactNode } from "react";

/** Minimal, safe markdown renderer (headings, paragraphs, bullet lists, bold). No raw HTML is ever injected. */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((block, i) => {
    const t = block.trim();
    if (!t) return;
    if (t.startsWith("# ")) out.push(<h1 key={i}>{inline(t.slice(2))}</h1>);
    else if (t.startsWith("## ")) out.push(<h2 key={i}>{inline(t.slice(3))}</h2>);
    else if (t.startsWith("### ")) out.push(<h3 key={i}>{inline(t.slice(4))}</h3>);
    else if (t.split("\n").every((l) => /^[-*] /.test(l.trim()))) out.push(<ul key={i}>{t.split("\n").map((l, j) => <li key={j}>{inline(l.trim().slice(2))}</li>)}</ul>);
    else out.push(<p key={i}>{t.split("\n").map((l, j) => <span key={j}>{inline(l)}{j < t.split("\n").length - 1 && <br />}</span>)}</p>);
  });
  return <div className={className}>{out}</div>;
}

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}
