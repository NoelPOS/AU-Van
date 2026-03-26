// SSE (Server-Sent Events) Manager - Singleton + Observer Pattern

type SSEClient = {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private static instance: SSEManager;
  private clients: Map<string, SSEClient> = new Map();

  private constructor() {}

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  addClient(id: string, userId: string, controller: ReadableStreamDefaultController): void {
    this.clients.set(id, { id, userId, controller });
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  // Send to a specific user
  sendToUser(userId: string, event: string, data: unknown): void {
    const encoder = new TextEncoder();
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      if (client.userId === userId) {
        try {
          client.controller.enqueue(encoder.encode(message));
        } catch {
          this.removeClient(client.id);
        }
      }
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: unknown): void {
    const encoder = new TextEncoder();
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      try {
        client.controller.enqueue(encoder.encode(message));
      } catch {
        this.removeClient(client.id);
      }
    });
  }

  // Send to all admin users
  sendToAdmins(event: string, data: unknown, adminUserIds: string[]): void {
    const adminSet = new Set(adminUserIds);
    const encoder = new TextEncoder();
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      if (adminSet.has(client.userId)) {
        try {
          client.controller.enqueue(encoder.encode(message));
        } catch {
          this.removeClient(client.id);
        }
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = SSEManager.getInstance();
