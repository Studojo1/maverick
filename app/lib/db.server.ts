import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Rely on env from Docker (env_file + environment) or host (export, .env loaded by runner).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle({ client: pool });
 
export default db;

