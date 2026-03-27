"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Trash2, X } from "lucide-react";
import { useRoutes, useCreateRoute, useDeleteRoute } from "@/hooks/queries";

export default function AdminRoutesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from: "", to: "", price: 0, duration: 0 });

  const { data: routes = [], isLoading } = useRoutes();
  const createRoute = useCreateRoute();
  const deleteRoute = useDeleteRoute();

  const handleCreate = async () => {
    try {
      await createRoute.mutateAsync({
        from: form.from,
        to: form.to,
        price: Number(form.price),
        duration: Number(form.duration) || undefined,
      });
      setShowForm(false);
      setForm({ from: "", to: "", price: 0, duration: 0 });
    } catch {
      // error available via createRoute.error
    }
  };

  if (isLoading) return <PageLoading />;

  const error = createRoute.error?.message || "";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Routes</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Create and manage van routes</p>
          </div>
          <Button className="rounded-xl" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-1 h-4 w-4" /> Cancel</> : <><Plus className="mr-1 h-4 w-4" /> New Route</>}
          </Button>
        </div>

        {showForm && (
          <Card className="rounded-2xl border-border/60">
            <CardHeader><CardTitle className="text-lg">Create Route</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">From</Label>
                <Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}
                  placeholder="Assumption University" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">To</Label>
                <Input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}
                  placeholder="Mega Bangna" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">Price (THB)</Label>
                <Input type="number" value={form.price} min={0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">Duration (min, optional)</Label>
                <Input type="number" value={form.duration} min={0}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="mt-1.5 rounded-xl" />
              </div>
              {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}
              <div className="sm:col-span-2">
                <Button onClick={handleCreate} disabled={createRoute.isPending || !form.from || !form.to}
                  className="w-full rounded-xl">{createRoute.isPending ? "Creating..." : "Create Route"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {deleteRoute.error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {deleteRoute.error.message}
          </div>
        )}

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {routes.length === 0 ? <EmptyState title="No routes yet" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-semibold">{r.from}</TableCell>
                      <TableCell>{r.to}</TableCell>
                      <TableCell>{r.price} THB</TableCell>
                      <TableCell className="text-muted-foreground">{r.duration ? `${r.duration} min` : "--"}</TableCell>
                      <TableCell>
                        <Badge variant="outline"
                          className={r.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate this route?</AlertDialogTitle>
                              <AlertDialogDescription>This will mark the route as inactive.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRoute.mutate(r._id)}>Deactivate</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
