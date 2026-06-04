import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://build_placeholder:build@127.0.0.1/db";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
