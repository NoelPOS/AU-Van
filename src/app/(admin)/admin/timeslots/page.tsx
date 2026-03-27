"use client";

import { useMemo, useState } from "react";
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
import { TIMESLOT_STATUS_VARIANT, formatStatus } from "@/constants/status-styles";
import { cn } from "@/libs/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_PRESETS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];
const TODAY = new Date().toISOString().split("T")[0];

type Mode = "none" | "single" | "bulk";

function formatTimeLabel(time: string) {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(twelveHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

function countSelectedDaysInRange(dateFrom: string, dateTo: string, daysOfWeek: number[]) {
  if (!dateFrom || !dateTo || dateFrom > dateTo || daysOfWeek.length === 0) return 0;

  const [fy, fm, fd] = dateFrom.split("-").map(Number);
  const [ty, tm, td] = dateTo.split("-").map(Number);

  const current = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td));
  let selectedCount = 0;

  while (current <= end) {
    if (daysOfWeek.includes(current.getUTCDay())) {
      selectedCount += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return selectedCount;
}

export default function AdminTimeslotsPage() {
  const [selectedRoute, setSelectedRoute] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>("none");
  const [customTime, setCustomTime] = useState("");

  // Single create form
  const [form, setForm] = useState({ routeId: "", date: "", time: "", totalSeats: 12 });

  // Bulk create form
  const [bulk, setBulk] = useState({
    routeId: "",
    dateFrom: "",
    dateTo: "",
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri default
    times: ["07:00", "08:00", "09:00", "10:00", "11:00", "13:00"],
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

  const selectedDaysInRange = useMemo(
    () => countSelectedDaysInRange(bulk.dateFrom, bulk.dateTo, bulk.daysOfWeek),
    [bulk.dateFrom, bulk.dateTo, bulk.daysOfWeek]
  );
  const estimatedSlots = selectedDaysInRange * bulk.times.length;
  const estimatedSeatRecords = estimatedSlots * Number(bulk.totalSeats || 0);

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

  function togglePresetTime(time: string) {
    setBulk((b) => {
      const nextTimes = b.times.includes(time)
        ? b.times.filter((t) => t !== time)
        : [...b.times, time];

      return {
        ...b,
        times: Array.from(new Set(nextTimes)).sort(),
      };
    });
  }

  function addCustomTime() {
    if (!/^\d{2}:\d{2}$/.test(customTime)) return;
    setBulk((b) => ({
      ...b,
      times: Array.from(new Set([...b.times, customTime])).sort(),
    }));
    setCustomTime("");
  }

  function removeTime(time: string) {
    setBulk((b) => ({
      ...b,
      times: b.times.filter((t) => t !== time),
    }));
  }

  const handleBulkCreate = async () => {
    try {
      const result = await bulkCreate.mutateAsync({
        routeId: activeBulkRouteId,
        dateFrom: bulk.dateFrom,
        dateTo: bulk.dateTo,
        daysOfWeek: bulk.daysOfWeek,
        times: Array.from(new Set(bulk.times)).sort(),
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
                    <option key={r._id} value={r._id}>{r.from}{" -> "}{r.to}</option>
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
                Create timeslots for a date range at once. Existing route/date/time rows are skipped automatically.
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
                    <option key={r._id} value={r._id}>{r.from}{" -> "}{r.to}</option>
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
                    <button key={day} type="button"
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
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Departure Times</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Toggle preset departures, then add custom times only when needed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map((time) => {
                    const selected = bulk.times.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => togglePresetTime(time)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-foreground"
                        )}
                      >
                        {formatTimeLabel(time)}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Selected Times ({bulk.times.length})</Label>
                  {bulk.times.length === 0 ? (
                    <p className="text-xs text-destructive">Select at least one departure time.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {[...bulk.times].sort().map((time) => (
                        <Badge key={time} variant="secondary" className="rounded-lg gap-1 pl-2 pr-1 py-1">
                          <span>{formatTimeLabel(time)}</span>
                          <button
                            type="button"
                            onClick={() => removeTime(time)}
                            className="rounded-full p-0.5 hover:bg-background/80"
                            aria-label={`Remove ${time}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2 max-w-sm">
                  <div className="flex-1">
                    <Label className="text-xs font-medium">Custom Time</Label>
                    <Input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addCustomTime} disabled={!customTime}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Total seats */}
              <div className="w-52">
                <Label className="text-xs font-medium">Total Seats per Slot</Label>
                <Input type="number" value={bulk.totalSeats} min={1} max={50}
                  onChange={(e) => setBulk({ ...bulk, totalSeats: Number(e.target.value) })}
                  className="mt-1.5 rounded-xl" />
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <p>
                  Estimated generation: <span className="font-semibold">{estimatedSlots}</span> timeslot(s)
                  and about <span className="font-semibold">{estimatedSeatRecords}</span> seat record(s).
                </p>
                {estimatedSlots > 250 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Large batches can take longer. If needed, split by shorter date ranges.
                  </p>
                )}
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
              {r.from}{" -> "}{r.to}
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
                          <Badge variant={TIMESLOT_STATUS_VARIANT[ts.status] ?? "outline"}>
                            {formatStatus(ts.status)}
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
