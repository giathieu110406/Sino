import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

let dbInstance: NodePgDatabase<any> | null = null;
let poolInstance: pg.Pool | null = null;

export function isDbConfigured(): boolean {
  return !!(
    process.env.SQL_HOST &&
    process.env.SQL_DB_NAME &&
    process.env.SQL_USER &&
    process.env.SQL_PASSWORD
  );
}

export function getDb(): NodePgDatabase<any> | null {
  if (!isDbConfigured()) {
    return null;
  }
  if (!dbInstance) {
    try {
      poolInstance = new pg.Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: false,
        connectionTimeoutMillis: 3000,
      });
      dbInstance = drizzle(poolInstance);
    } catch (e) {
      console.error("Failed to initialize database pool:", e);
      return null;
    }
  }
  return dbInstance;
}

// Fallback dummy db object for compatibility if directly referenced
export const db = new Proxy({} as NodePgDatabase<any>, {
  get(target, prop) {
    const activeDb = getDb();
    if (!activeDb) {
      throw new Error("Database is not configured or unavailable.");
    }
    return (activeDb as any)[prop];
  }
});

