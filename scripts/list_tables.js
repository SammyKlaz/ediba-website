import dotenv from 'dotenv';
dotenv.config();
import pool from '../config/db.js';

const listTables = async () => {
  try {
    const result = await pool.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
    );
    console.log('Public tables:');
    result.rows.forEach(r => console.log('-', r.tablename));
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error listing tables:', err.message || err);
    process.exit(1);
  }
};

listTables();
