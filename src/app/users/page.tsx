"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  RefreshCw,
  Loader2,
  UserPlus,
} from "lucide-react";

interface UserRecord {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: "admin" | "user";
  createdAt: string;
  lastLoginAt: string;
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Add User dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<"user" | "admin">("user");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ ok: boolean; data: UserRecord[] }>("/api/admin/users");
      setUsers(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me) fetchUsers();
  }, [me]);

  const handleRoleToggle = async (u: UserRecord) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    setUpdatingRole(u.uid);
    try {
      await apiFetch(`/api/admin/users/${u.uid}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((x) => (x.uid === u.uid ? { ...x, role: newRole } : x)),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/users/${deleteTarget.uid}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.uid !== deleteTarget.uid));
      setDeleteTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddUser = async () => {
    setAddError("");
    if (!addEmail || !addPassword) {
      setAddError("Email and password are required.");
      return;
    }
    setAdding(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: UserRecord }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: addEmail,
          password: addPassword,
          name: addName || addEmail,
          role: addRole,
        }),
      });
      setUsers((prev) => [res.data, ...prev]);
      setAddOpen(false);
      setAddEmail("");
      setAddPassword("");
      setAddName("");
      setAddRole("user");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  };

  if (!me) {
    return (
      <p className="text-zinc-500 mt-16 text-center text-sm">
        Sign in to view users.
      </p>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add User
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              : users.map((u) => (
                  <tr
                    key={u.uid}
                    className="border-b border-zinc-800/30 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-full shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                        <span className="text-sm text-zinc-200 font-medium">
                          {u.name}
                          {u.uid === me?.uid && (
                            <span className="ml-1.5 text-[10px] text-zinc-500">
                              (you)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <Mail className="h-3.5 w-3.5 text-zinc-600" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === "admin" ? "default" : "outline"}
                        className="text-xs cursor-pointer select-none"
                        onClick={() =>
                          u.uid !== me?.uid && handleRoleToggle(u)
                        }
                        title={
                          u.uid === me?.uid
                            ? "Cannot change your own role"
                            : `Click to make ${u.role === "admin" ? "user" : "admin"}`
                        }
                      >
                        {updatingRole === u.uid ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Shield className="h-3 w-3 mr-1" />
                        )}
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                        {new Date(u.lastLoginAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              u.uid !== me?.uid && handleRoleToggle(u)
                            }
                            disabled={
                              u.uid === me?.uid || updatingRole === u.uid
                            }
                          >
                            <Shield className="text-zinc-400" />
                            Make {u.role === "admin" ? "User" : "Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-300"
                            onClick={() =>
                              u.uid !== me?.uid && setDeleteTarget(u)
                            }
                            disabled={u.uid === me?.uid}
                          >
                            <Trash2 /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
            {!loading && users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-zinc-600 text-sm"
                >
                  No users yet. Add one with the button above or wait for a
                  Google sign-in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) {
            setAddOpen(false);
            setAddError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new account. The user can log in with email &amp;
              password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {addError && (
              <p className="text-red-400 text-xs rounded bg-red-950/30 border border-red-900/40 px-3 py-2">
                {addError}
              </p>
            )}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Full name (optional)"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Email</label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Password</label>
              <input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddRole("user")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    addRole === "user"
                      ? "border-zinc-400 bg-zinc-800 text-zinc-100"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setAddRole("admin")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                    addRole === "admin"
                      ? "border-zinc-400 bg-zinc-800 text-zinc-100"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setAddError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={adding}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Remove{" "}
              <span className="font-medium text-zinc-300">
                {deleteTarget?.name}
              </span>
              ? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
