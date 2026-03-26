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
import { useRoutes, useAdminTimeslots, useCreateTimeslot, useCancelTimeslot } from "@/hooks/queries";

export default function AdminTimeslotsPage() {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ routeId: "", date: "", time: "", totalSeats: 12 });

  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();

  // Auto-select first route when routes load
  const activeRoute = selectedRoute || routes[0]?._id || "";
  const activeFormRouteId = form.routeId || activeRoute;

  const { data: timeslots = [] } = useAdminTimeslots(activeRoute);
  const createTimeslot = useCreateTimeslot();
  const cancelTimeslot = useCancelTimeslot();

  const handleCreate = async () => {
    try {
      await createTimeslot.mutateAsync({
        routeId: activeFormRouteId,
        date: form.date,
        time: form.time,
        totalSeats: Number(form.totalSeats),
      });
      setShowForm(false);
      setForm({ routeId: activeRoute, date: "", time: "", totalSeats: 12 });
    } catch {
      // error available via createTimeslot.error
    }
  };

  if (loadingRoutes) return <PageLoading />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Timeslots</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Create and manage departure times</p>
          </div>
          <Button className="rounded-xl" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="mr-1 h-4 w-4" /> Cancel</> : <><Plus className="mr-1 h-4 w-4" /> New Timeslot</>}
          </Button>
        </div>

        {showForm && (
          <Card className="rounded-2xl border-border/60">
            <CardHeader><CardTitle className="text-lg">Create Timeslot</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">Route</Label>
                <select value={activeFormRouteId}
                  onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>{r.from} → {r.to}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">Total Seats</Label>
                <Input type="number" value={form.totalSeats} min={1} max={50}
                  onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })} className="mt-1.5 rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleCreate} disabled={createTimeslot.isPending || !form.date || !form.time}
                  className="w-full rounded-xl">{createTimeslot.isPending ? "Creating..." : "Create Timeslot"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route tabs */}
        <div className="flex gap-2 flex-wrap">
          {routes.map((r) => (
            <Button key={r._id} variant={activeRoute === r._id ? "default" : "outline"} size="sm" className="rounded-xl"
              onClick={() => setSelectedRoute(r._id)}>
              {r.from} → {r.to}
            </Button>
          ))}
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {timeslots.length === 0 ? <EmptyState title="No timeslots for this route" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Booked</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeslots.map((ts) => (
                    <TableRow key={ts._id}>
                      <TableCell className="text-sm">{ts.date}</TableCell>
                      <TableCell className="font-semibold">{ts.time}</TableCell>
                      <TableCell>{ts.totalSeats}</TableCell>
                      <TableCell>{ts.bookedSeats}</TableCell>
                      <TableCell className={ts.totalSeats - ts.bookedSeats <= 3 ? "font-semibold text-destructive" : ""}>
                        {ts.totalSeats - ts.bookedSeats}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ts.status === "active" ? "outline" : "secondary"}
                          className={ts.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>
                          {ts.status}
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
                              <AlertDialogTitle>Cancel this timeslot?</AlertDialogTitle>
                              <AlertDialogDescription>This will mark it as cancelled.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelTimeslot.mutate(ts._id)}>Cancel Timeslot</AlertDialogAction>
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
