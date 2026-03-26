"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Shield, ShieldOff } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) {
      setUsers(json.data.users || []);
      setTotalPages(json.data.totalPages || 1);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleAdmin = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: "PUT" });
    const json = await res.json();
    if (json.success) {
      setUsers((prev) =>
        prev.map((u) => u._id === id ? { ...u, isAdmin: json.data.isAdmin } : u)
      );
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage user accounts and admin roles</p>
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {users.length === 0 ? <EmptyState title="No users" /> : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary">
                              {u.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.phone || "--"}</TableCell>
                        <TableCell>
                          <Badge variant="outline"
                            className={u.isAdmin ? "border-primary/20 bg-primary/5 text-primary" : ""}>
                            {u.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => toggleAdmin(u._id)}
                            className={u.isAdmin ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"}
                            title={u.isAdmin ? "Remove Admin" : "Make Admin"}>
                            {u.isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                    <span className="text-xs text-muted-foreground">Page {page}/{totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
