import pkg from "pg";
const { Pool } = pkg;

// Support either a full DATABASE_URL (e.g. on production) or individual
// DB_* env vars (used in the repository .env file). This makes local
// development easier while still supporting hosted Postgres.
let poolConfig;
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined
  };
}

const pool = new Pool(poolConfig);

export default pool;