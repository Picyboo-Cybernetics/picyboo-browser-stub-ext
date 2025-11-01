#!/usr/bin/env node
/**
 * Mock export pipeline demonstrating how vault captures could be
 * transformed before uploading to a secure endpoint.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXPORT_PATH = path.join(__dirname, '..', 'dist', 'vault-export.json');
const FALLBACK_PATH = path.join(__dirname, 'sample-captures.json');

function readVaultDump() {
  if (fs.existsSync(EXPORT_PATH)) {
    return JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  }
  return JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8'));
}

function verifyIntegrity(entry) {
  const expected = crypto.createHash('sha256').update(entry.url).digest('hex');
  return expected === entry.hash;
}

function buildPayload(entries) {
  return {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    items: entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      url: entry.url,
      tags: entry.tags,
      note: entry.note,
      confidence: entry.confidence,
      hash: entry.hash,
      hashVerified: verifyIntegrity(entry),
      source: entry.source,
      createdAt: entry.createdAt
    }))
  };
}

function main() {
  const entries = readVaultDump();
  const payload = buildPayload(entries);
  process.stdout.write(JSON.stringify(payload, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { readVaultDump, buildPayload, verifyIntegrity };
