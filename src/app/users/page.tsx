"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreVertical, Pencil, Trash2, Shield, User, Mail, Calendar,
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: string;
  avatar?: string;
}

const SAMPLE_USERS: UserRecord[] = [
  {
    id: "1",
    name: "Goutham Sankar",
    email: "gouthamsankarv@gmail.com",
    role: "admin",
    createdAt: "2026-01-15T00:00:00Z",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(SAMPLE_USERS);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const handleAdd = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setUsers([...users, {
      id: String(Date.now()),
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      createdAt: new Date().toISOString(),
    }]);
    setAddOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("viewer");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setUsers(users.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add User
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <span className="text-sm text-zinc-200 font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                    <Mail className="h-3.5 w-3.5 text-zinc-600" />
                    {user.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "admin" ? "default" : "outline"} className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>
                        <Pencil className="text-zinc-400" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={() => setDeleteTarget(user)}>
                        <Trash2 /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Add a new user to the admin panel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Email</label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" type="email" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "admin" | "viewer")}
                className="w-full h-9 px-3 text-sm bg-zinc-950 border border-zinc-800 rounded-md text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newName.trim() || !newEmail.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-zinc-300">{deleteTarget?.name}</span>? They will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
