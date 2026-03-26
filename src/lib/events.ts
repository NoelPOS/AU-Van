// Observer Pattern - Global Event Emitter (Singleton)

type EventHandler = (...args: unknown[]) => void | Promise<void>;
const EVENT_HANDLER_TIMEOUT_MS = Number(process.env.EVENT_HANDLER_TIMEOUT_MS) || 4000;

class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  async emit(event: string, ...args: unknown[]): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const promises = Array.from(handlers).map(async (handler) => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      try {
        await Promise.race([
          Promise.resolve(handler(...args)),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              reject(new Error(`Handler timeout after ${EVENT_HANDLER_TIMEOUT_MS}ms`));
            }, EVENT_HANDLER_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        console.error(`Event handler error for "${event}":`, error);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Event name constants
export const Events = {
  BOOKING_CREATED: "booking:created",
  BOOKING_UPDATED: "booking:updated",
  BOOKING_CANCELLED: "booking:cancelled",
  BOOKING_CONFIRMED: "booking:confirmed",
  PAYMENT_COMPLETED: "payment:completed",
  PAYMENT_FAILED: "payment:failed",
  PAYMENT_REFUNDED: "payment:refunded",
  SEAT_LOCKED: "seat:locked",
  SEAT_RELEASED: "seat:released",
  SEAT_BOOKED: "seat:booked",
} as const;

export const eventBus = EventBus.getInstance();
