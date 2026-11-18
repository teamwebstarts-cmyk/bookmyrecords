/**
 * BookMyRecords — persistence adapter.
 * Supports:
 *   1. MongoDB Atlas (Recommended for Render deployment)
 *   2. Supabase REST + Storage
 *   3. Local filesystem (development fallback)
 */

'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const ROOT = path.resolve(__dirname, '..', '..');

let mongoClient = null;
let mongoDb = null;

async function getMongoDb() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) return null;
  if (mongoDb) return mongoDb;

  try {
    mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'bookmyrecords';
    mongoDb = mongoClient.db(dbName);
    console.log(`[Storage] Connected to MongoDB Atlas: ${dbName}`);
    return mongoDb;
  } catch (err) {
    console.error('[Storage] MongoDB connection error:', err.message);
    return null;
  }
}

function isEnabled() {
  if (process.env.MONGODB_URI) return true;
  return process.env.STORAGE_ENABLED === 'true';
}

function driver() {
  if (process.env.MONGODB_URI) return 'mongodb';
  const d = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
  const base = supabaseBase();
  if (d === 'supabase') {
    if (!base || base.includes('your-project') || !process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY === 'replace-me') {
      return 'local';
    }
  }
  return d;
}

function localDirs() {
  const pdfDir = path.resolve(ROOT, process.env.PDF_OUTPUT_DIR || 'storage/reports');
  const recordDir = path.join(path.dirname(pdfDir), 'submissions');
  return { pdfDir, recordDir };
}

function ensureDirs() {
  const { pdfDir, recordDir } = localDirs();
  fsSync.mkdirSync(pdfDir, { recursive: true });
  fsSync.mkdirSync(recordDir, { recursive: true });
  return { pdfDir, recordDir };
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

function supabaseBase() {
  return (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
}

function bucket() {
  return process.env.SUPABASE_BUCKET || 'bmr-reports';
}

function recordPath(reportId) {
  return path.join(localDirs().recordDir, `${String(reportId).replace(/[^A-Za-z0-9_-]/g, '_')}.json`);
}

function pdfPath(reportId) {
  return path.join(localDirs().pdfDir, `${String(reportId).replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`);
}

async function saveRecord(record) {
  if (!isEnabled()) return { skipped: true };
  if (!record || !record.report_id) throw new Error('record.report_id is required');

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      await db.collection('submissions').updateOne(
        { report_id: record.report_id },
        { $set: record },
        { upsert: true }
      );
      return { stored: true, driver: 'mongodb' };
    }
  }

  if (driver() === 'supabase') {
    try {
      const res = await fetch(`${supabaseBase()}/rest/v1/submissions`, {
        method: 'POST',
        headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(record)
      });
      if (!res.ok) throw new Error(`Supabase insert failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return { stored: true, driver: 'supabase' };
    } catch (err) {
      console.warn('[Storage] Supabase saveRecord failed, falling back to local disk:', err.message);
    }
  }

  ensureDirs();
  await fs.writeFile(recordPath(record.report_id), JSON.stringify(record, null, 2), 'utf8');
  return { stored: true, driver: 'local' };
}

async function getRecord(reportId) {
  if (!isEnabled()) return null;

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      const doc = await db.collection('submissions').findOne({ report_id: reportId });
      if (doc) {
        delete doc._id; // Remove MongoDB internal ID for clean serialization
        return doc;
      }
    }
  }

  if (driver() === 'supabase') {
    try {
      const res = await fetch(
        `${supabaseBase()}/rest/v1/submissions?report_id=eq.${encodeURIComponent(reportId)}&select=*`,
        { headers: supabaseHeaders() }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows[0] || null;
    } catch (err) {
      console.warn('[storage] Supabase getRecord lookup failed:', err.message);
      return null;
    }
  }

  try {
    return JSON.parse(await fs.readFile(recordPath(reportId), 'utf8'));
  } catch (_) {
    return null;
  }
}

async function savePdf(reportId, buffer) {
  if (!isEnabled()) return { skipped: true };
  if (!Buffer.isBuffer(buffer)) throw new Error('PDF buffer is required');

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      await db.collection('reports_pdf').updateOne(
        { report_id: reportId },
        { 
          $set: { 
            report_id: reportId, 
            buffer: buffer, 
            size: buffer.length,
            created_at: new Date() 
          } 
        },
        { upsert: true }
      );
      return { stored: true, driver: 'mongodb', path: `/api/checkup/report/${encodeURIComponent(reportId)}/pdf` };
    }
  }

  if (driver() === 'supabase') {
    const objectPath = `${reportId}.pdf`;
    const key = process.env.SUPABASE_SERVICE_KEY || '';
    const res = await fetch(`${supabaseBase()}/storage/v1/object/${bucket()}/${objectPath}`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      },
      body: buffer
    });
    if (!res.ok) throw new Error(`Supabase Storage upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return { stored: true, driver: 'supabase', path: objectPath };
  }

  ensureDirs();
  await fs.writeFile(pdfPath(reportId), buffer);
  return { stored: true, driver: 'local', path: pdfPath(reportId) };
}

async function getPdfBuffer(reportId) {
  if (!isEnabled()) return null;

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      const doc = await db.collection('reports_pdf').findOne({ report_id: reportId });
      if (doc && doc.buffer) {
        return Buffer.isBuffer(doc.buffer) ? doc.buffer : doc.buffer.buffer || Buffer.from(doc.buffer);
      }
    }
  }

  if (driver() === 'supabase') {
    const res = await fetch(`${supabaseBase()}/storage/v1/object/${bucket()}/${reportId}.pdf`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_KEY || '', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY || ''}` }
    });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  }

  try {
    return await fs.readFile(pdfPath(reportId));
  } catch (_) {
    return null;
  }
}

async function getPdfUrl(reportId) {
  if (!isEnabled()) return null;

  if (driver() === 'mongodb') {
    return `/api/checkup/report/${encodeURIComponent(reportId)}/pdf`;
  }

  if (driver() === 'supabase') {
    const key = process.env.SUPABASE_SERVICE_KEY || '';
    const res = await fetch(`${supabaseBase()}/storage/v1/object/sign/${bucket()}/${reportId}.pdf`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 3600 })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.signedURL ? `${supabaseBase()}${data.signedURL}` : null;
  }

  return `/api/checkup/report/${encodeURIComponent(reportId)}/pdf`;
}

async function updateBooking(reportId, booking) {
  if (!isEnabled()) return { skipped: true };
  const existing = await getRecord(reportId);
  if (!existing) return { updated: false, reason: 'record_not_found' };
  const alreadyBooked = !!(existing.booking && existing.booking.booked_at);

  const updatedFields = {
    status: 'booked',
    booking: { 
      ...(existing.booking || {}), 
      ...booking, 
      booked_at: existing.booking?.booked_at || booking.booked_at || new Date().toISOString() 
    },
    updated_at: new Date().toISOString()
  };

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      await db.collection('submissions').updateOne(
        { report_id: reportId },
        { $set: updatedFields }
      );
      return { updated: true, driver: 'mongodb', already_booked: alreadyBooked };
    }
  }

  if (driver() === 'supabase') {
    const res = await fetch(
      `${supabaseBase()}/rest/v1/submissions?report_id=eq.${encodeURIComponent(reportId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(updatedFields)
      }
    );
    if (!res.ok) throw new Error(`Supabase booking update failed: HTTP ${res.status}`);
    return { updated: true, driver: 'supabase', already_booked: alreadyBooked };
  }

  const record = { ...existing, ...updatedFields };
  ensureDirs();
  await fs.writeFile(recordPath(reportId), JSON.stringify(record, null, 2), 'utf8');
  return { updated: true, driver: 'local', already_booked: alreadyBooked };
}

async function markPdfStored(reportId, pdfMeta) {
  if (!isEnabled()) return { claimed: false, skipped: true };
  const existing = await getRecord(reportId);
  if (!existing) return { claimed: false, reason: 'record_not_found' };
  if (existing.pdf && existing.pdf.stored) return { claimed: false, record: existing };

  const updatedFields = { pdf: pdfMeta, updated_at: new Date().toISOString() };

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      await db.collection('submissions').updateOne(
        { report_id: reportId },
        { $set: updatedFields }
      );
      return { claimed: true, record: { ...existing, ...updatedFields } };
    }
  }

  if (driver() === 'supabase') {
    const res = await fetch(
      `${supabaseBase()}/rest/v1/submissions?report_id=eq.${encodeURIComponent(reportId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(updatedFields)
      }
    );
    if (!res.ok) throw new Error(`Supabase PDF claim failed: HTTP ${res.status}`);
    return { claimed: true, record: { ...existing, ...updatedFields } };
  }

  const record = { ...existing, ...updatedFields };
  ensureDirs();
  await fs.writeFile(recordPath(reportId), JSON.stringify(record, null, 2), 'utf8');
  return { claimed: true, record };
}

async function listRecords() {
  if (!isEnabled()) return [];

  if (driver() === 'mongodb') {
    const db = await getMongoDb();
    if (db) {
      const records = await db.collection('submissions')
        .find({})
        .sort({ created_at: -1 })
        .toArray();
      return records.map(r => {
        delete r._id;
        return r;
      });
    }
  }

  if (driver() === 'supabase') {
    try {
      const res = await fetch(
        `${supabaseBase()}/rest/v1/submissions?select=*&order=created_at.desc`,
        { headers: supabaseHeaders() }
      );
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('[storage] Supabase listRecords failed:', err.message);
      return [];
    }
  }

  ensureDirs();
  const files = await fs.readdir(localDirs().recordDir);
  const out = [];
  for (const f of files.filter(f => f.endsWith('.json'))) {
    try {
      out.push(JSON.parse(await fs.readFile(path.join(localDirs().recordDir, f), 'utf8')));
    } catch (_) { /* skip */ }
  }
  // Sort descending by created_at
  out.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return out;
}

module.exports = {
  isEnabled, driver, saveRecord, getRecord, savePdf, getPdfBuffer,
  getPdfUrl, updateBooking, markPdfStored, listRecords, recordPath, pdfPath
};
