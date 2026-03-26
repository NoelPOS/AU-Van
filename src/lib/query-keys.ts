export const queryKeys = {
  bookings: {
    all: ["bookings"] as const,
    list: (filters?: object) => ["bookings", "list", filters] as const,
    detail: (id: string) => ["bookings", id] as const,
    admin: (filters?: object) => ["bookings", "admin", filters] as const,
    dashboard: ["bookings", "dashboard"] as const,
  },
  payments: {
    all: ["payments"] as const,
    mine: ["payments", "mine"] as const,
    admin: (filters?: object) => ["payments", "admin", filters] as const,
  },
  routes: {
    all: ["routes"] as const,
    detail: (id: string) => ["routes", id] as const,
  },
  timeslots: {
    all: ["timeslots"] as const,
    byRoute: (routeId: string, date?: string) => ["timeslots", routeId, date] as const,
    detail: (id: string) => ["timeslots", id] as const,
  },
  seats: {
    byTimeslot: (timeslotId: string) => ["seats", timeslotId] as const,
  },
  users: {
    me: ["users", "me"] as const,
    admin: (page?: number) => ["users", "admin", page] as const,
    detail: (id: string) => ["users", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
};
