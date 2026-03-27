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
import { Plus, Trash2, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useRoutes,
  useAdminTimeslots,
  useCreateTimeslot,
  useCancelTimeslot,
  useBulkCreateTimeslots,
} from "@/hooks/queries";
import { cn } from "@/libs/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = new Date().toISOString().split("T")[0];

type Mode = "none" | "single" | "bulk";

export default function AdminTimeslotsPage() {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>("none");

  // Single create form
  const [form, setForm] = useState({ routeId: "", date: "", time: "", totalSeats: 12 });

  // Bulk create form
  const [bulk, setBulk] = useState({
    routeId: "",
    dateFrom: "",
    dateTo: "",
    daysOfWeek: [1, 2, 3, 4, 5], // Mon–Fri default
    times: ["07:00"],
    totalSeats: 12,
  });
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(null);

  const { data: routes = [], isLoading: loadingRoutes } = useRoutes();

  const activeRoute = selectedRoute || routes[0]?._id || "";
  const activeFormRouteId = form.routeId || activeRoute;
  const activeBulkRouteId = bulk.routeId || activeRoute;

  const { data: paginatedData } = useAdminTimeslots(activeRoute, page);
  const timeslots = paginatedData?.data ?? [];
  const totalPages = paginatedData?.totalPages ?? 1;

  const createTimeslot = useCreateTimeslot();
  const cancelTimeslot = useCancelTimeslot();
  const bulkCreate = useBulkCreateTimeslots();

  function switchRoute(routeId: string) {
    setSelectedRoute(routeId);
    setPage(1);
  }

  function toggleMode(next: Mode) {
    setMode((prev) => (prev === next ? "none" : next));
    setBulkResult(null);
  }

  // Single create
  const handleCreate = async () => {
    try {
      await createTimeslot.mutateAsync({
        routeId: activeFormRouteId,
        date: form.date,
        time: form.time,
        totalSeats: Number(form.totalSeats),
      });
      setMode("none");
      setForm({ routeId: activeRoute, date: "", time: "", totalSeats: 12 });
    } catch {
      // error shown via createTimeslot.error
    }
  };

  // Bulk helpers
  function toggleDay(dow: number) {
    setBulk((b) => ({
      ...b,
      daysOfWeek: b.daysOfWeek.includes(dow)
        ? b.daysOfWeek.filter((d) => d !== dow)
        : [...b.daysOfWeek, dow].sort(),
    }));
  }

  function addTime() {
    setBulk((b) => ({ ...b, times: [...b.times, "07:00"] }));
  }

  function removeTime(i: number) {
    setBulk((b) => ({ ...b, times: b.times.filter((_, idx) => idx !== i) }));
  }

  function updateTime(i: number, val: string) {
    setBulk((b) => {
      const times = [...b.times];
      times[i] = val;
      return { ...b, times };
    });
  }

  const handleBulkCreate = async () => {
    try {
      const result = await bulkCreate.mutateAsync({
        routeId: activeBulkRouteId,
        dateFrom: bulk.dateFrom,
        dateTo: bulk.dateTo,
        daysOfWeek: bulk.daysOfWeek,
        times: bulk.times,
        totalSeats: Number(bulk.totalSeats),
      });
      setBulkResult(result);
      setPage(1);
    } catch {
      // error shown via bulkCreate.error
    }
  };

  const bulkValid =
    bulk.dateFrom &&
    bulk.dateTo &&
    bulk.dateFrom <= bulk.dateTo &&
    bulk.daysOfWeek.length > 0 &&
    bulk.times.length > 0 &&
    bulk.times.every((t) => /^\d{2}:\d{2}$/.test(t));

  if (loadingRoutes) return <PageLoading />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Timeslots</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Create and manage departure times</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => toggleMode("bulk")}>
              {mode === "bulk"
                ? <><X className="mr-1 h-4 w-4" /> Cancel</>
                : <><Calendar className="mr-1 h-4 w-4" /> Generate Schedule</>}
            </Button>
            <Button className="rounded-xl" onClick={() => toggleMode("single")}>
              {mode === "single"
                ? <><X className="mr-1 h-4 w-4" /> Cancel</>
                : <><Plus className="mr-1 h-4 w-4" /> New Timeslot</>}
            </Button>
          </div>
        </div>

        {/* Single create form */}
        {mode === "single" && (
          <Card className="rounded-2xl border-border/60">
            <CardHeader><CardTitle className="text-lg">Create Timeslot</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium">Route</Label>
                <select
                  value={activeFormRouteId}
                  onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>{r.from} → {r.to}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={form.date} min={TODAY}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">Time</Label>
                <Input type="time" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-medium">Total Seats</Label>
                <Input type="number" value={form.totalSeats} min={1} max={50}
                  onChange={(e) => setForm({ ...form, totalSeats: Number(e.target.value) })}
                  className="mt-1.5 rounded-xl" />
              </div>
              {createTimeslot.error && (
                <p className="sm:col-span-2 text-sm text-destructive">{createTimeslot.error.message}</p>
              )}
              <div className="sm:col-span-2">
                <Button onClick={handleCreate}
                  disabled={createTimeslot.isPending || !form.date || !form.time}
                  className="w-full rounded-xl">
                  {createTimeslot.isPending ? "Creating..." : "Create Timeslot"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk / Generate Schedule form */}
        {mode === "bulk" && (
          <Card className="rounded-2xl border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Generate Schedule</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create timeslots for a range of dates at once — duplicates are skipped automatically.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Route */}
              <div>
                <Label className="text-xs font-medium">Route</Label>
                <select
                  value={activeBulkRouteId}
                  onChange={(e) => setBulk({ ...bulk, routeId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm">
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>{r.from} → {r.to}</option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-medium">From Date</Label>
                  <Input type="date" value={bulk.dateFrom} min={TODAY}
                    onChange={(e) => setBulk({ ...bulk, dateFrom: e.target.value })}
                    className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-medium">To Date</Label>
                  <Input type="date" value={bulk.dateTo} min={bulk.dateFrom || TODAY}
                    onChange={(e) => setBulk({ ...bulk, dateTo: e.target.value })}
                    className="mt-1.5 rounded-xl" />
                </div>
              </div>

              {/* Days of week */}
              <div>
                <Label className="text-xs font-medium">Days of Week</Label>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {DAYS.map((day, i) => (
                    <button key={i} type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        bulk.daysOfWeek.includes(i)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-foreground"
                      )}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure times */}
              <div>
                <Label className="text-xs font-medium">Departure Times</Label>
                <div className="mt-2 space-y-2">
                  {bulk.times.map((t, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input type="time" value={t}
                        onChange={(e) => updateTime(i, e.target.value)}
                        className="rounded-xl w-40" />
                      {bulk.times.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeTime(i)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTime} className="rounded-xl">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Time
                  </Button>
                </div>
              </div>

              {/* Total seats */}
              <div className="w-40">
                <Label className="text-xs font-medium">Total Seats per Slot</Label>
                <Input type="number" value={bulk.totalSeats} min={1} max={50}
                  onChange={(e) => setBulk({ ...bulk, totalSeats: Number(e.target.value) })}
                  className="mt-1.5 rounded-xl" />
              </div>

              {/* Error */}
              {bulkCreate.error && (
                <p className="text-sm text-destructive">{bulkCreate.error.message}</p>
              )}

              {/* Success result */}
              {bulkResult && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  <span className="font-semibold">{bulkResult.created}</span> timeslot(s) created
                  {bulkResult.skipped > 0 && (
                    <>, <span className="font-semibold">{bulkResult.skipped}</span> skipped (already existed)</>
                  )}.
                </div>
              )}

              <Button onClick={handleBulkCreate}
                disabled={bulkCreate.isPending || !bulkValid}
                className="w-full rounded-xl">
                {bulkCreate.isPending ? "Generating..." : "Generate Schedule"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Route tabs */}
        <div className="flex gap-2 flex-wrap">
          {routes.map((r) => (
            <Button key={r._id}
              variant={activeRoute === r._id ? "default" : "outline"}
              size="sm" className="rounded-xl"
              onClick={() => switchRoute(r._id)}>
              {r.from} → {r.to}
            </Button>
          ))}
        </div>

        {/* Table */}
        {cancelTimeslot.error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {cancelTimeslot.error.message}
          </div>
        )}

        <Card className="rounded-2xl border-border/60">
          <CardContent className="pt-6">
            {timeslots.length === 0 ? (
              <EmptyState title="No timeslots for this route" />
            ) : (
              <>
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
                          <Badge
                            variant={ts.status === "active" ? "outline" : "secondary"}
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
                                <AlertDialogAction onClick={() => cancelTimeslot.mutate(ts._id)}>
                                  Cancel Timeslot
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border/40">
                    <Button variant="outline" size="sm" className="rounded-xl"
                      disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" className="rounded-xl"
                      disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
