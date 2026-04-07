#!/usr/bin/env node
import pool from '../config/db.js';
import { parsePublicIdFromUrl } from '../utils/cloudinaryHelpers.js';

// Simple backfill script. Usage:
// node scripts/backfill_public_ids.js --dry-run
// node scripts/backfill_public_ids.js --commit

const args = process.argv.slice(2);
const commit = args.includes('--commit');

const targets = [
  { table: 'events', urlCol: 'flyer', publicCol: 'flyer_public_id', idCol: 'id' },
  { table: 'ministers', urlCol: 'photo', publicCol: 'photo_public_id', idCol: 'id' },
  { table: 'homepage_images', urlCol: 'file_path', publicCol: 'public_id', idCol: 'id' },
  { table: 'birthdays', urlCol: 'photo', publicCol: 'photo_public_id', idCol: 'id' },
  { table: 'event_media', urlCol: 'file_name', publicCol: 'public_id', idCol: 'id' },
  { table: 'receipts', urlCol: 'image', publicCol: 'image_public_id', idCol: 'id' }
];

async function backfillOne(target) {
  const rows = await pool.query(
    `SELECT ${target.idCol}, ${target.urlCol}, ${target.publicCol} FROM ${target.table} WHERE ${target.publicCol} IS NULL AND ${target.urlCol} IS NOT NULL`
  );

  const updates = [];

  for (const row of rows.rows) {
    const url = row[target.urlCol];
    const id = row[target.idCol];
    const parsed = parsePublicIdFromUrl(url);
    if (parsed) {
      updates.push({ id, public_id: parsed });
    }
  }

  if (updates.length === 0) {
    console.log(`No candidates for ${target.table}`);
    return;
  }

  console.log(`Found ${updates.length} candidates for ${target.table}`);
  updates.slice(0, 20).forEach(u => console.log(u));

  if (commit) {
    for (const u of updates) {
      await pool.query(
        `UPDATE ${target.table} SET ${target.publicCol} = $1 WHERE ${target.idCol} = $2`,
        [u.public_id, u.id]
      );
    }
    console.log(`Committed ${updates.length} updates for ${target.table}`);
  } else {
    console.log(`Dry-run: use --commit to write ${updates.length} updates for ${target.table}`);
  }
}

async function run() {
  try {
    for (const t of targets) {
      await backfillOne(t);
    }
  } catch (err) {
    console.error('Error during backfill', err);
  } finally {
    await pool.end();
    console.log('Done');
  }
}

run();
