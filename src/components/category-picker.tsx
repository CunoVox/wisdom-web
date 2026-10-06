import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, Grid2X2 } from "lucide-react";
import type { Category } from "../types";
import { MorphSymbol } from "./morph-symbol";

export function categoryRows(categories: Category[]) {
  const rows: (Category & { depth: number; ancestors: string[] })[] = [];
  const visited = new Set<string>();
  function visit(parent: string | null, ancestors: string[]) {
    categories.filter(c => (c.parentId || null) === parent).forEach(c => {
      if (visited.has(c.id)) return;
      visited.add(c.id);
      rows.push({ ...c, depth: ancestors.length, ancestors });
      visit(c.id, [...ancestors, c.id]);
    });
  }
  visit(null, []);
  return rows;
}

export function CategoryPicker({ categories, value, onChange }: {
  categories: Category[]; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const [path, setPath] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const children = (id: string | null) => categories.filter(c => (c.parentId || null) === id);
  const choose = (id: string) => { onChange(id); setOpen(false); trigger.current?.focus(); };
  const columns = [children(null), ...path.map(children)].filter(c => c.length);
  return <div className="category-picker" ref={root} onKeyDown={e => {
    if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); }
  }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="secondary" aria-expanded={open} aria-controls={panelId} onClick={() => {
      if (!open) { const row = categoryRows(categories).find(c => c.id === value); setPath(row ? [...row.ancestors, row.id] : []); }
      setOpen(!open);
    }}><MorphSymbol kind="category" active={open} />{categories.find(c => c.id === value)?.name || "Danh mục"}</button>
    {open && <div id={panelId} className="category-popover" aria-label="Danh mục khóa học">
      <button className="category-all" type="button" onClick={() => choose("")}>Tất cả khóa học</button>
      <div className="category-columns">
        {columns.map((items, level) => <div className="category-column" key={level}>
          {items.map(c => <div key={c.id} className={`category-item ${path[level] === c.id ? "selected" : ""}`} onMouseEnter={() => setPath([...path.slice(0, level), c.id])}>
            <button type="button" aria-pressed={value === c.id} onClick={() => choose(c.id)}>{c.name}</button>
            {children(c.id).length > 0 && <button type="button" aria-label={`Mở danh mục con của ${c.name}`} aria-expanded={path[level] === c.id} onClick={() => setPath([...path.slice(0, level), c.id])}><ChevronRight size={16} /></button>}
          </div>)}
          {!items.length && <p>Chưa có danh mục.</p>}
        </div>)}
        {!categories.length && <p className="p-4 text-muted">Chưa có danh mục.</p>}
      </div>
    </div>}
  </div>;
}
