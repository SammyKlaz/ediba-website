#!/usr/bin/env node
import cloudinary from '../config/cloudinary.js';

// Usage: node scripts/list_recent_cloudinary.js [days]
// Example: node scripts/list_recent_cloudinary.js 7

const days = parseInt(process.argv[2], 10) || 7;
const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

async function listRecent() {
  try {
    // Use Cloudinary search API to find resources created since cutoff
    const expr = `created_at>=\"${cutoff}\"`;
    const res = await cloudinary.search
      .expression(expr)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const resources = res.resources || [];
    console.log(`Found ${resources.length} resources uploaded since ${cutoff}:`);
    resources.forEach(r => {
      console.log(JSON.stringify({
        public_id: r.public_id,
        resource_type: r.resource_type,
        format: r.format,
        bytes: r.bytes,
        created_at: r.created_at,
        secure_url: r.secure_url
      }));
    });

    if (res.next_cursor) {
      console.log('\nNote: there are more results. Use pagination with next_cursor to retrieve additional pages.');
      console.log('next_cursor:', res.next_cursor);
    }
  } catch (err) {
    console.error('Error listing Cloudinary resources:', err);
    process.exitCode = 2;
  }
}

listRecent();
