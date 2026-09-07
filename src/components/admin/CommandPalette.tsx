"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { ADMIN_NAV } from "@/lib/resources";
import { cn } from "@/lib/utils";

type Command = { id: string; label: string; group: string; href: string; keywords?: string };

/** Subsequence fuzzy match with a simple relevance score (higher = better). */
function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct >= 0) return 100 - direct; // substring match beats scattered letters
  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      streak++;
      score += 2 + streak; // consecutive matches score higher
    } else {
      streak = 0;
    }
  }
  return qi === q.length ? score : 0;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) {
            // Reset the search when opening (event handlers may setState freely).
            setQuery("");
            setActive(0);
          }
          return !o;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      ...ADMIN_NAV.filter((n) => n.href !== "/admin").map((n) => ({ id: n.href, label: n.label, group: "Go to", href: n.href, keywords: n.label })),
      { id: "view-site", label: "Open public website", group: "Go to", href: "/", keywords: "site public home" },
      { id: "new-project", label: "Create new project", group: "Actions", href: "/admin/projects?new=1", keywords: "add create project" },
      { id: "new-market", label: "Create new market", group: "Actions", href: "/admin/markets?new=1", keywords: "add create country" },
      { id: "new-city", label: "Create new city", group: "Actions", href: "/admin/cities?new=1", keywords: "add create city" },
      { id: "pipeline", label: "Open lead pipeline", group: "Actions", href: "/admin/leads/pipeline", keywords: "kanban crm board" },
      { id: "media", label: "Upload media", group: "Actions", href: "/admin/media", keywords: "upload image video" },
      { id: "settings", label: "Site settings", group: "Actions", href: "/admin/settings", keywords: "config theme intro video" },
    ],
    [],
  );

  const results = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, s: Math.max(fuzzyScore(query, c.label), fuzzyScore(query, c.keywords ?? "") * 0.6) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, 9).map((r) => r.c);
  }, [commands, query]);

  // Keep the highlighted row valid as results change (render-adjust pattern —
  // avoids a setState-in-effect cascade).
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActive(0);
  }

  if (!open) return null;

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center bg-ink/40 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ y: -12, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-ink/8 px-4">
              <Search className="h-4 w-4 shrink-0 text-mist" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % Math.max(results.length, 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % Math.max(results.length, 1)); }
                  if (e.key === "Enter" && results[active]) { e.preventDefault(); run(results[active].href); }
                }}
                placeholder="Type a command or search…"
                aria-label="Search commands"
                className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-mist"
              />
              <kbd className="rounded-md border border-ink/10 px-1.5 py-0.5 text-[10px] text-mist">ESC</kbd>
            </div>
            <ul role="listbox" aria-label="Commands" className="max-h-[320px] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-mist">No matching commands</li>}
              {results.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(c.href)}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition", i === active ? "bg-brand/10 text-brand" : "text-ink hover:bg-ivory-deep")}
                  >
                    <span className="w-[52px] shrink-0 text-[10px] uppercase tracking-wider text-mist">{c.group}</span>
                    <span className="flex-1 truncate font-medium">{c.label}</span>
                    <ArrowRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", i === active ? "translate-x-0.5 text-brand" : "text-mist")} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-ink/8 px-4 py-2 text-[10.5px] text-mist">
              <span>↑↓ navigate · ↵ open</span>
              <span>⌘K / Ctrl+K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
