"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";

interface Category {
  name: string;
  count: number;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  // Rename dialog
  const [renameTarget, setRenameTarget] = useState<Category | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ ok: boolean; data: Category[] }>("/api/admin/categories");
      setCategories(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert("Category already exists.");
      return;
    }
    setCreating(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: Category }>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setCategories((prev) => [res.data, ...prev]);
      setCreateOpen(false);
      setCreateName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameTo.trim()) return;
    setRenaming(true);
    try {
      await apiFetch("/api/admin/categories/rename", {
        method: "PATCH",
        body: JSON.stringify({ oldName: renameTarget.name, newName: renameTo.trim() }),
      });
      setCategories((prev) =>
        prev.map((c) =>
          c.name === renameTarget.name ? { ...c, name: renameTo.trim() } : c,
        ),
      );
      setRenameTarget(null);
      setRenameTo("");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/categories/${encodeURIComponent(deleteTarget.name)}`, {
        method: "DELETE",
      });
      setCategories((prev) => prev.filter((c) => c.name !== deleteTarget.name));
      setDeleteTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return <p className="text-zinc-500 mt-16 text-center text-sm">Sign in to view categories.</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Categories</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{categories.length} categories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Category
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCategories}>Retry</Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden divide-y divide-zinc-800/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 px-4 py-12 text-center text-zinc-600 text-sm">
          No categories yet. Create one or assign a category to a run.
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden divide-y divide-zinc-800/40">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <Tag className="h-4 w-4 text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-200 font-medium truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-zinc-600 font-mono bg-zinc-800/60 px-2 py-0.5 rounded-full">
                  {cat.count} run{cat.count !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => { setRenameTarget(cat); setRenameTo(cat.name); }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-all"
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {cat.name !== "Other" && (
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>
              Enter a name for the new category. Assign it to runs from the Designs page.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. SaaS, E-commerce, Fintech"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
            <DialogDescription>
              Renaming <span className="font-mono text-zinc-300">{renameTarget?.name}</span> will update all {renameTarget?.count} run{renameTarget?.count !== 1 ? "s" : ""} with this category.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={renameTo}
            onChange={(e) => setRenameTo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={renaming || !renameTo.trim() || renameTo.trim() === renameTarget?.name}>
              {renaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Delete <span className="font-mono text-zinc-300">{deleteTarget?.name}</span>? All {deleteTarget?.count} run{deleteTarget?.count !== 1 ? "s" : ""} will be reset to <span className="font-mono text-zinc-300">Other</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
