/**
 * One-off migration: MongoDB (users, extensions) → Supabase (auth.users, profiles, extensions).
 *
 *   node scripts/migrate-mongo-to-supabase.js            # dry run, prints what would happen
 *   node scripts/migrate-mongo-to-supabase.js --apply    # performs the migration
 *
 * Needs MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in backend/.env.
 * Idempotent: rows are matched by legacy_mongo_id, so it can be re-run safely.
 * MongoDB data is only read, never modified.
 * Passwords: existing bcrypt hashes are imported, so users keep their password.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Extension = require('../models/Extension.model');
const { getSupabase } = require('../services/supabase');
const { sanitizeFiles } = require('../utils/sanitize');

const APPLY = process.argv.includes('--apply');

const findAuthUserByEmail = async (sb, email) => {
  for (let page = 1; page < 1000; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
  return null;
};

const main = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  const sb = getSupabase();
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log(`Connected to MongoDB. Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  const idMap = new Map(); // mongo user id → supabase uuid
  const stats = { users: 0, usersExisting: 0, usersFailed: 0, extensions: 0, extensionsSkipped: 0, extensionsFailed: 0 };

  const users = await User.find({}).select('+password').lean();
  for (const u of users) {
    const legacyId = u._id.toString();
    const { data: existing } = await sb.from('profiles').select('id').eq('legacy_mongo_id', legacyId).maybeSingle();
    if (existing) {
      idMap.set(legacyId, existing.id);
      stats.usersExisting++;
      continue;
    }
    if (!APPLY) {
      stats.users++;
      continue;
    }
    try {
      let authUser;
      const { data, error } = await sb.auth.admin.createUser({
        email: u.email,
        password_hash: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
      });
      if (error) {
        // Account may already exist in Supabase (e.g. user signed up again).
        authUser = await findAuthUserByEmail(sb, u.email);
        if (!authUser) throw error;
      } else {
        authUser = data.user;
      }
      const { error: pErr } = await sb
        .from('profiles')
        .upsert({ id: authUser.id, name: u.name || '', legacy_mongo_id: legacyId, created_at: u.createdAt });
      if (pErr) throw pErr;
      idMap.set(legacyId, authUser.id);
      stats.users++;
    } catch (e) {
      stats.usersFailed++;
      console.error(`User ${legacyId} failed: ${e.message}`);
    }
  }

  const extensions = await Extension.find({}).lean();
  for (const ext of extensions) {
    const legacyId = ext._id.toString();
    const ownerId = idMap.get(ext.userId?.toString());
    if (APPLY && !ownerId) {
      stats.extensionsSkipped++;
      console.warn(`Extension ${legacyId} skipped: owner not migrated`);
      continue;
    }
    const { data: existing } = await sb.from('extensions').select('id').eq('legacy_mongo_id', legacyId).maybeSingle();
    if (existing) {
      stats.extensionsSkipped++;
      continue;
    }
    let files;
    try {
      files = sanitizeFiles(ext.files.map((f) => ({ filename: f.filename, content: f.content })));
    } catch (e) {
      stats.extensionsFailed++;
      console.error(`Extension ${legacyId} has unsafe files, not migrated: ${e.message}`);
      continue;
    }
    if (!APPLY) {
      stats.extensions++;
      continue;
    }
    const { error } = await sb.from('extensions').insert({
      user_id: ownerId,
      title: (ext.title || 'Untitled').slice(0, 200),
      prompt: ext.prompt || '',
      files,
      is_public: Boolean(ext.isPublic),
      upvotes: ext.upvotes || 0,
      clone_count: ext.cloneCount || 0,
      store_assets: { description: ext.storeAssets?.description || '' },
      monetization_link: ext.monetizationLink || null,
      iteration_history: (ext.iterationHistory || []).map((h) => ({ prompt: h.prompt, timestamp: h.timestamp })),
      legacy_mongo_id: legacyId,
      created_at: ext.createdAt,
      updated_at: ext.updatedAt || ext.createdAt,
    });
    if (error) {
      stats.extensionsFailed++;
      console.error(`Extension ${legacyId} failed: ${error.message}`);
    } else {
      stats.extensions++;
    }
  }

  console.log(APPLY ? 'Migrated:' : 'Would migrate:', stats);
  await mongoose.disconnect();
};

main().catch(async (e) => {
  console.error('Migration failed:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
