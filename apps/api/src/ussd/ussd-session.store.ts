export interface UssdSession {
  phone: string;
  businessId: string | null;
  step: string;
  data: Record<string, any>;
  lastActivity: Date;
}

export class UssdSessionStore {
  private sessions = new Map<string, UssdSession>();

  get(sessionId: string): UssdSession | undefined {
    return this.sessions.get(sessionId);
  }

  set(sessionId: string, session: UssdSession): void {
    this.sessions.set(sessionId, {
      ...session,
      lastActivity: new Date(),
    });
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Clean sessions older than 5 minutes
  cleanup(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [id, session] of this.sessions) {
      if (session.lastActivity < fiveMinutesAgo) {
        this.sessions.delete(id);
      }
    }
  }
}
