/**
 * Vocabulary Enrichment Pipeline
 * Enriches model_e_dataset_final_with_hebrew.json with definitions and examples
 * using Claude API (claude-haiku-4-5-20251001) in batches of 30 entries.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/enrich-vocabulary.mjs
 *
 * Supports resuming: progress is checkpointed after every batch.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Paths ────────────────────────────────────────────────────────────────────
const INPUT_PATH      = path.join(ROOT, 'src/data/model_e_dataset_final_with_hebrew.json');
const OUTPUT_PRETTY   = path.join(ROOT, 'src/data/model_e_dataset_final_enriched.json');
const OUTPUT_MIN      = path.join(ROOT, 'src/data/model_e_dataset_final_enriched.min.json');
const OUTPUT_CSV      = path.join(ROOT, 'src/data/model_e_dataset_review_candidates.csv');
const CHECKPOINT_PATH = path.join(__dirname, 'enrich-checkpoint.json');

// ── Config ───────────────────────────────────────────────────────────────────
const BATCH_SIZE    = 30;
const DELAY_MS      = 250;   // ms between API calls
const MODEL         = 'claude-haiku-4-5-20251001';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCheckpoint(processed) {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(processed, null, 2));
}

/**
 * Decide whether an entry needs quality review.
 * Returns { needed: boolean, reason: string }
 */
function reviewFlag(entry, finalDef, finalExample, defSource) {
  const reasons = [];

  if (entry.partOfSpeech === 'abbreviation') {
    reasons.push('abbreviation');
  }
  if (/\(/.test(entry.lemma)) {
    reasons.push('parenthetical-variant');
  }
  if (entry.bagrut?.asDistractor && !entry.bagrut?.asCorrect) {
    reasons.push('distractor-only-in-bagrut');
  }
  if (entry.type === 'phrase' && !entry.bagrut?.appeared) {
    reasons.push('phrase-no-bagrut-data');
  }
  if (defSource === 'generated') {
    const wordCount = finalDef.trim().split(/\s+/).length;
    if (wordCount < 4) reasons.push('short-definition');
    // Check if definition just repeats the display word
    const displayLower = (entry.display || entry.lemma || '').toLowerCase();
    if (finalDef.toLowerCase().startsWith(displayLower + ' ') ||
        finalDef.toLowerCase() === displayLower) {
      reasons.push('circular-definition');
    }
  }

  return {
    needed: reasons.length > 0,
    reason: reasons.join('; '),
  };
}

/**
 * Build the prompt for a batch of entries needing enrichment.
 */
function buildPrompt(batch) {
  const items = batch.map(e => {
    const hint = e.bagrut?.correctDefinitions?.length
      ? `  bagrut_hint: ${JSON.stringify(e.bagrut.correctDefinitions[0])}`
      : '';
    return `- id: "${e.id}", word: "${e.display || e.lemma}", partOfSpeech: "${e.partOfSpeech}", band: ${e.band}${hint ? '\n' + hint : ''}`;
  }).join('\n');

  return `You are a vocabulary expert creating content for Israeli high school students (ages 15-18) preparing for the English Bagrut Module E exam.

For each word below, provide:
1. A short, clear English definition (6-15 words). Style: dictionary / Bagrut exam style. No bullet points.
   - Must be in English, not a translation
   - Must NOT simply repeat the word itself
   - For phrases, define the whole phrase meaning (not individual words)
   - For abbreviations, explain what it stands for and means
   - If a bagrut_hint is provided, use it as the primary source but rephrase slightly for consistency
2. A simple, natural English example sentence (8-15 words) that clearly illustrates the meaning.

Return ONLY a valid JSON array (no markdown, no extra text):
[
  { "id": "...", "definition": "...", "example": "..." },
  ...
]

Words to process:
${items}`;
}

/**
 * Call Claude API with retry on transient errors.
 */
async function callClaude(client, prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0]?.text ?? '';

      // Extract JSON array from response
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON array found in response');

      return JSON.parse(match[0]);
    } catch (err) {
      if (attempt === 3) throw err;
      console.warn(`  Attempt ${attempt} failed: ${err.message} — retrying in 2s`);
      await sleep(2000);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('Usage: ANTHROPIC_API_KEY=sk-... node scripts/enrich-vocabulary.mjs');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log('📖 Reading input dataset...');
  const rawData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`   ${rawData.length} entries loaded.\n`);

  // Load checkpoint (maps id → { definition, example, definitionSource, exampleSource })
  const processed = loadCheckpoint();
  const alreadyDone = Object.keys(processed).length;
  if (alreadyDone > 0) {
    console.log(`♻️  Resuming from checkpoint: ${alreadyDone} entries already processed.\n`);
  }

  // ── Classify entries ──────────────────────────────────────────────────────
  const needsWork = []; // entries that need at least definition or example

  for (const entry of rawData) {
    if (processed[entry.id]) continue; // already done

    const hasDef  = Boolean(entry.definition);
    const hasEx   = Boolean(entry.example);

    if (!hasDef || !hasEx) {
      needsWork.push(entry);
    }
    // Entries with both definition and example are marked "existing" during merge
  }

  console.log(`🔧 Entries needing enrichment: ${needsWork.length}`);
  console.log(`   (${rawData.length - needsWork.length - alreadyDone} already complete in source)\n`);

  // ── Process in batches ────────────────────────────────────────────────────
  const totalBatches = Math.ceil(needsWork.length / BATCH_SIZE);
  let batchNum = 0;
  let apiErrors = 0;

  for (let i = 0; i < needsWork.length; i += BATCH_SIZE) {
    const batch = needsWork.slice(i, i + BATCH_SIZE);
    batchNum++;

    process.stdout.write(
      `\r⚡ Batch ${batchNum}/${totalBatches} — entries ${i + 1}–${Math.min(i + BATCH_SIZE, needsWork.length)} of ${needsWork.length}    `
    );

    let results;
    try {
      const prompt = buildPrompt(batch);
      results = await callClaude(client, prompt);
    } catch (err) {
      apiErrors++;
      console.warn(`\n  ⚠️  Batch ${batchNum} failed after retries: ${err.message}`);
      // Fallback: use lemma as definition, skip example generation
      results = batch.map(e => ({
        id: e.id,
        definition: e.bagrut?.correctDefinitions?.[0] || e.lemma,
        example: null,
      }));
    }

    // Index results by id for fast lookup
    const resultMap = {};
    for (const r of results) {
      if (r.id) resultMap[r.id] = r;
    }

    // Merge into processed map
    for (const entry of batch) {
      const r = resultMap[entry.id] || {};
      const hasBagrutDef = entry.bagrut?.correctDefinitions?.length > 0;
      const hadDef = Boolean(entry.definition);
      const hadEx  = Boolean(entry.example);

      processed[entry.id] = {
        definition:       hadDef ? entry.definition : (r.definition || entry.bagrut?.correctDefinitions?.[0] || entry.lemma),
        example:          hadEx  ? entry.example    : (r.example || `This word is used in context: ${entry.display || entry.lemma}.`),
        definitionSource: hadDef ? 'existing' : (hasBagrutDef ? 'bagrut' : 'generated'),
        exampleSource:    hadEx  ? 'existing' : 'generated',
      };
    }

    saveCheckpoint(processed);
    await sleep(DELAY_MS);
  }

  console.log('\n\n✅ All batches complete.\n');

  // ── Build enriched dataset ────────────────────────────────────────────────
  console.log('🔨 Assembling enriched dataset...');

  let defsGenerated  = 0;
  let exsGenerated   = 0;
  let reviewCount    = 0;

  const enriched = rawData.map(entry => {
    const hasDef = Boolean(entry.definition);
    const hasEx  = Boolean(entry.example);
    const hasBagrutDef = entry.bagrut?.correctDefinitions?.length > 0;

    let finalDef, finalEx, defSource, exSource;

    if (hasDef && hasEx) {
      // Fully present in source
      finalDef  = entry.definition;
      finalEx   = entry.example;
      defSource = 'existing';
      exSource  = 'existing';
    } else {
      const p = processed[entry.id] || {};
      finalDef  = hasDef ? entry.definition : p.definition;
      finalEx   = hasEx  ? entry.example    : p.example;
      defSource = hasDef ? 'existing' : (hasBagrutDef ? 'bagrut' : 'generated');
      exSource  = hasEx  ? 'existing' : 'generated';
    }

    // Ensure nothing is null (final safety net)
    if (!finalDef) finalDef = entry.lemma || entry.display;
    if (!finalEx)  finalEx  = `${entry.display || entry.lemma} is used in many contexts.`;

    if (defSource !== 'existing') defsGenerated++;
    if (exSource  !== 'existing') exsGenerated++;

    const { needed, reason } = reviewFlag(entry, finalDef, finalEx, defSource);
    if (needed) reviewCount++;

    // Preserve original field order; append new metadata fields
    return {
      id:           entry.id,
      lemma:        entry.lemma,
      display:      entry.display,
      surfaceForms: entry.surfaceForms,
      type:         entry.type,
      partOfSpeech: entry.partOfSpeech,
      band:         entry.band,
      bands:        entry.bands,
      module:       entry.module,
      definition:   finalDef,
      hebrew:       entry.hebrew,
      example:      finalEx,
      tags:         entry.tags,
      bagrut:       entry.bagrut,
      // ── new metadata ──
      definitionSource:    defSource,
      exampleSource:       exSource,
      qualityReviewNeeded: needed,
      _reviewReason:       reason || undefined,
    };
  });

  // ── Write output files ────────────────────────────────────────────────────
  console.log('💾 Writing output files...');

  fs.writeFileSync(OUTPUT_PRETTY, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`   ✓ ${path.relative(ROOT, OUTPUT_PRETTY)}`);

  fs.writeFileSync(OUTPUT_MIN, JSON.stringify(enriched), 'utf-8');
  console.log(`   ✓ ${path.relative(ROOT, OUTPUT_MIN)}`);

  // CSV
  const reviewCandidates = enriched.filter(e => e.qualityReviewNeeded);
  const csvHeader = 'id,lemma,display,partOfSpeech,band,definitionSource,definition,example,reviewReason';
  const csvRows = reviewCandidates.map(e => {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [
      esc(e.id),
      esc(e.lemma),
      esc(e.display),
      esc(e.partOfSpeech),
      esc(e.band),
      esc(e.definitionSource),
      esc(e.definition),
      esc(e.example),
      esc(e._reviewReason || ''),
    ].join(',');
  });
  fs.writeFileSync(OUTPUT_CSV, [csvHeader, ...csvRows].join('\n'), 'utf-8');
  console.log(`   ✓ ${path.relative(ROOT, OUTPUT_CSV)}`);

  // Clean up checkpoint on success
  if (fs.existsSync(CHECKPOINT_PATH)) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log('   ✓ Checkpoint cleaned up.\n');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('─'.repeat(50));
  console.log(`Total entries:          ${enriched.length}`);
  console.log(`Definitions generated:  ${defsGenerated}`);
  console.log(`Examples generated:     ${exsGenerated}`);
  console.log(`Quality review needed:  ${reviewCount}`);
  if (apiErrors > 0) {
    console.log(`API batch errors:       ${apiErrors} (fallback used for those batches)`);
  }
  console.log('─'.repeat(50));

  // 20 sample repaired entries (those that had something generated)
  const samples = enriched
    .filter(e => e.definitionSource !== 'existing' || e.exampleSource !== 'existing')
    .slice(0, 20);

  console.log('\n📋 20 Sample Repaired Entries:\n');
  for (const s of samples) {
    console.log(JSON.stringify({
      id:               s.id,
      word:             s.display,
      partOfSpeech:     s.partOfSpeech,
      definition:       s.definition,
      example:          s.example,
      definitionSource: s.definitionSource,
      exampleSource:    s.exampleSource,
      qualityReview:    s.qualityReviewNeeded,
    }, null, 2));
    console.log();
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
