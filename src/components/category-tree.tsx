import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { Category } from "../types";
import { categoryRows } from "./category-picker";
import { Empty, useAction } from "./ui";

type Draft =
  | { kind: "create"; parentId: string | null; name: string }
  | { kind: "edit"; id: string; parentId: string | null; name: string }
  | null;

export function CategoryTree({ categories }: { categories: Category[] }) {
  const action = useAction();
  const rows = useMemo(() => categoryRows(categories), [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    categories.forEach((category) => {
      const parentId = category.parentId || null;
      const children = map.get(parentId) || [];
      children.push(category);
      map.set(parentId, children);
    });
    return map;
  }, [categories]);

  const roots = childrenByParent.get(null) || [];
  const expandableIds = useMemo(
    () =>
      new Set(
        categories
          .filter((category) => (childrenByParent.get(category.id) || []).length > 0)
          .map((category) => category.id),
      ),
    [categories, childrenByParent],
  );

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(roots.map((category) => category.id)),
  );
  const [draft, setDraft] = useState<Draft>(null);

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startCreate = (parentId: string | null) => {
    setDraft({ kind: "create", parentId, name: "" });
    if (parentId) {
      setExpanded((current) => new Set(current).add(parentId));
    }
  };

  const startEdit = (category: Category) => {
    setDraft({
      kind: "edit",
      id: category.id,
      parentId: category.parentId || null,
      name: category.name,
    });
  };

  const saveDraft = () => {
    if (!draft || !draft.name.trim()) return;

    if (draft.kind === "create") {
      const parentId = draft.parentId;
      action.mutate(
        {
          path: "/admin/categories",
          data: {
            name: draft.name.trim(),
            parentId: parentId || "",
          },
        },
        {
          onSuccess: () => {
            if (parentId) {
              setExpanded((current) => new Set(current).add(parentId));
            }
            setDraft(null);
          },
        },
      );
      return;
    }

    action.mutate(
      {
        path: "/admin/categories/" + draft.id,
        method: "put",
        data: {
          name: draft.name.trim(),
          parentId: draft.parentId || "",
        },
      },
      { onSuccess: () => setDraft(null) },
    );
  };

  const deleteCategory = (category: Category) => {
    const childCount = (childrenByParent.get(category.id) || []).length;
    const warning =
      childCount > 0
        ? " Danh mục này đang có " + childCount + " danh mục con."
        : "";
    if (!window.confirm('Xóa danh mục "' + category.name + '"?' + warning)) return;

    action.mutate({
      path: "/admin/categories/" + category.id,
      method: "delete",
    });
  };

  const renderDraft = (depth: number, parentName?: string) => {
    if (!draft) return null;

    if (draft.kind === "create") {
      return (
        <form
          className="flex items-center gap-2 border-b border-line bg-canvas py-3 pr-3 flex-wrap"
          style={{ paddingLeft: depth * 22 + 12 }}
          onSubmit={(event) => {
            event.preventDefault();
            saveDraft();
          }}
        >
          <Plus size={16} className="text-brand shrink-0" />
          <input
            autoFocus
            aria-label={
              parentName ? "Tên danh mục con của " + parentName : "Tên danh mục gốc"
            }
            className="flex-1 min-w-[220px]"
            placeholder={parentName ? "Tên danh mục con..." : "Tên danh mục gốc..."}
            maxLength={120}
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
          <button
            type="submit"
            className="icon-button"
            aria-label="Lưu danh mục"
            title="Lưu"
            disabled={action.isPending || !draft.name.trim()}
          >
            <Check size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Hủy thêm danh mục"
            title="Hủy"
            onClick={() => setDraft(null)}
            disabled={action.isPending}
          >
            <X size={18} />
          </button>
        </form>
      );
    }

    const currentRow = rows.find((row) => row.id === draft.id);
    const parentOptions = rows.filter(
      (row) =>
        row.id !== draft.id &&
        !row.ancestors.includes(draft.id),
    );

    return (
      <form
        className="flex items-center gap-2 border-b border-line bg-canvas py-3 pr-3 flex-wrap"
        style={{ paddingLeft: depth * 22 + 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          saveDraft();
        }}
      >
        <input
          autoFocus
          aria-label="Tên danh mục"
          className="flex-1 min-w-[220px]"
          maxLength={120}
          value={draft.name}
          onChange={(event) =>
            setDraft({ ...draft, name: event.target.value })
          }
        />
        <select
          aria-label="Danh mục cha"
          className="min-w-[200px]"
          value={draft.parentId || ""}
          onChange={(event) =>
            setDraft({
              ...draft,
              parentId: event.target.value || null,
            })
          }
        >
          <option value="">Danh mục gốc</option>
          {parentOptions.map((row) => (
            <option key={row.id} value={row.id}>
              {"— ".repeat(row.depth) + row.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="icon-button"
          aria-label="Lưu thay đổi"
          title="Lưu"
          disabled={action.isPending || !draft.name.trim()}
        >
          <Check size={18} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Hủy sửa danh mục"
          title="Hủy"
          onClick={() => setDraft(null)}
          disabled={action.isPending}
        >
          <X size={18} />
        </button>
        {currentRow && (
          <small className="w-full text-muted">
            Cấp hiện tại: {currentRow.depth + 1}
          </small>
        )}
      </form>
    );
  };

  const renderNodes = (parentId: string | null, depth = 0) =>
    (childrenByParent.get(parentId) || []).map((category) => {
      const children = childrenByParent.get(category.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = expanded.has(category.id);
      const isEditing =
        draft?.kind === "edit" && draft.id === category.id;
      const isCreatingChild =
        draft?.kind === "create" && draft.parentId === category.id;

      return (
        <div key={category.id}>
          {isEditing ? (
            renderDraft(depth)
          ) : (
            <div
              className="flex items-center gap-2 border-b border-line py-3 pr-3 hover:bg-canvas"
              style={{ paddingLeft: depth * 22 + 8 }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className="icon-button shrink-0"
                  aria-label={
                    (isExpanded ? "Thu gọn " : "Mở ") + category.name
                  }
                  aria-expanded={isExpanded}
                  onClick={() => toggle(category.id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
              ) : (
                <span className="w-9 shrink-0" aria-hidden="true" />
              )}

              <div className="min-w-0 flex-1">
                <strong className="block truncate">{category.name}</strong>
                {hasChildren && (
                  <small className="text-muted">
                    {children.length} danh mục con
                  </small>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={"Thêm danh mục con vào " + category.name}
                  title="Thêm danh mục con"
                  disabled={action.isPending}
                  onClick={() => startCreate(category.id)}
                >
                  <Plus size={18} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={"Sửa " + category.name}
                  title="Sửa"
                  disabled={action.isPending}
                  onClick={() => startEdit(category)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  className="icon-button text-[#a33223]"
                  aria-label={"Xóa " + category.name}
                  title="Xóa"
                  disabled={action.isPending}
                  onClick={() => deleteCategory(category)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          )}

          {isCreatingChild && renderDraft(depth + 1, category.name)}
          {hasChildren && isExpanded && renderNodes(category.id, depth + 1)}
        </div>
      );
    });

  return (
    <section className="panel stack">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2>Cấu trúc danh mục</h2>
          <p className="text-sm text-muted mt-1">
            {categories.length} danh mục · Có thể mở, thu gọn và thêm danh mục con ngay tại từng nhánh.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="secondary"
            onClick={() => setExpanded(new Set(expandableIds))}
            disabled={!expandableIds.size}
          >
            Mở tất cả
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setExpanded(new Set())}
            disabled={!expanded.size}
          >
            Thu gọn
          </button>
          <button
            type="button"
            onClick={() => startCreate(null)}
            disabled={action.isPending}
          >
            <Plus size={17} />
            Danh mục gốc
          </button>
        </div>
      </div>

      <div className="border border-line rounded-xl overflow-hidden">
        {draft?.kind === "create" && draft.parentId === null && renderDraft(0)}
        {roots.length ? (
          renderNodes(null)
        ) : draft?.kind !== "create" ? (
          <Empty text="Chưa có danh mục">
            <button type="button" onClick={() => startCreate(null)}>
              <Plus size={17} />
              Tạo danh mục đầu tiên
            </button>
          </Empty>
        ) : null}
      </div>
    </section>
  );
}
