/**
 * utils/fetch-song-struct.mjs  —  standalone script, not part of the app build.
 *
 * Reads a Guitar Pro file and writes accurate section data (bar counts, BPMs,
 * time signatures) into public/songs.json.
 *
 * USAGE
 *   node utils/fetch-song-struct.mjs --gpfile "utils/tabs/song.gp" --id <songId>
 *   node utils/fetch-song-struct.mjs --gpfile "utils/tabs/song.gp" --id <songId> --dry-run
 *
 * GP files (.gp, .gp5, .gp4) are available at guitarprotabs.org or Ultimate Guitar.
 * Requires @coderline/alphatab (installed as a devDependency).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const SONGS_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../public/songs.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const arg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] ?? null : null; };

const GPFILE  = arg('--gpfile');
const SONG_ID = arg('--id');

// --- Guitar Pro parsing -----------------------------------------------------

async function parseGP(filePath) {
  const { importer } = await import('@coderline/alphatab');
  const score = importer.ScoreLoader.loadScoreFromBytes(
    new Uint8Array(readFileSync(filePath))
  );

  const markers = [];
  let tempo = score.tempo ?? 120;

  score.masterBars.forEach((mb, i) => {
    if (mb.tempoAutomation?.value) tempo = mb.tempoAutomation.value;
    if (mb.section) markers.push({ i, text: mb.section.text, tempo, beats: mb.timeSignatureNumerator });
  });

  const total = score.masterBars.length;
  const sections = markers.map((m, mi) => ({
    id: mi + 1,
    name: m.text.replace(/\s*[-–]\s*\d+:\d+$/, '').trim(),
    bars: (markers[mi + 1]?.i ?? total) - m.i,
    bpm: m.tempo,
    beatsPerBar: m.beats,
    subdivision: 1,
  }));

  return { score, sections: sections.length ? sections : null };
}

// --- Helpers ----------------------------------------------------------------

function printSections(sections) {
  const total = sections.reduce((a, s) => a + s.bars, 0);
  console.log(`${sections.length} sections, ${total} bars total\n`);
  console.log(sections.map(s =>
    `  ${String(s.id).padStart(2)}. ${s.name.padEnd(35)} ${String(s.bars).padStart(3)} bars  ${s.bpm} bpm  ${s.beatsPerBar}/4`
  ).join('\n'));
  if (DRY_RUN) console.log('\n[dry-run] songs.json not modified.');
}

function writeSections(songId, sections) {
  const songs = JSON.parse(readFileSync(SONGS_PATH, 'utf8'));
  const song = songs.find(s => s.id === songId);
  if (!song) { console.error(`No song with id "${songId}" in songs.json`); process.exit(1); }
  song.hasSections = true;
  song.sections = sections;
  writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2) + '\n');
  console.log(`\n✓ Updated "${song.title}" (${songId}) in songs.json`);
}

// --- Main -------------------------------------------------------------------

async function main() {
  if (!GPFILE || !SONG_ID) {
    console.error('Usage: node utils/fetch-song-struct.mjs --gpfile <path> --id <songId> [--dry-run]');
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), GPFILE);
  if (!existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }

  const { score, sections } = await parseGP(filePath);
  console.log(`"${score.title}" by ${score.artist}  ${score.tempo} bpm  ${score.masterBars.length} bars`);
  if (!sections) { console.error('No section markers found in this GP file.'); process.exit(1); }

  printSections(sections);
  if (!DRY_RUN) writeSections(SONG_ID, sections);
}

main().catch(e => { console.error(e.message); process.exit(1); });
