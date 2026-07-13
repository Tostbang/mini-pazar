#!/usr/bin/env node
// scripts/build-emoji-data.mjs
//
// Regenerates app/(site)/api/emojis/emoji-data.ts from:
//   - Unicode emoji-test.txt (CLDR — character + group + subgroup + canonical EN name)
//   - emojilib (npm — English keywords per emoji)
//
// Turkish names, subgroup labels, country names, and keywords are produced by
// translating the English source through LibreTranslate, with a per-string cache
// at .cache/emoji-translations.json so re-runs are near-instant.
//
// Usage:
//   node scripts/build-emoji-data.mjs                      # full run
//   node scripts/build-emoji-data.mjs --offline            # use cache only
//   node scripts/build-emoji-data.mjs --dry-run           # print diff, no writes
//   node scripts/build-emoji-data.mjs --verbose --concurrency=5
//
// Env:
//   LIBRETRANSLATE_URL         default: https://libretranslate.com
//   LIBRETRANSLATE_API_KEY     optional; required by some public instances

import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

// emojilib v3 ships a JSON file as its main entry; load it via CJS to avoid
// the JSON import-attribute requirement (Node 22+).
const cjsRequire = createRequire(import.meta.url);
const emojiLib = cjsRequire("emojilib");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(
  ROOT,
  "app/(site)/api/emojis/emoji-data.ts",
);
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_PATH = path.join(CACHE_DIR, "emoji-translations.json");
const RAW_CACHE_PATH = path.join(CACHE_DIR, "emoji-test.txt");

const UNICODE_EMOJI_TEST_URL =
  "https://unicode.org/Public/17.0.0/emoji/emoji-test.txt";

const LT_URL = process.env.LIBRETRANSLATE_URL ?? "https://libretranslate.com";
const LT_KEY = process.env.LIBRETRANSLATE_API_KEY ?? null;
const DEFAULT_CONCURRENCY = 3;
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 800;
const TOP_TERMS = 5;

// ---------------------------------------------------------------------------
// Hardcoded maps
// ---------------------------------------------------------------------------

// CLDR group ordinal → Turkish label. The keys MUST match the order Unicode
// uses in emoji-test.txt's `# group:` comments (see parseEmojiTest), not the
// order of the EmojiGroup union.
//   0 Smileys & Emotion → İfadeler & Duygular
//   1 People & Body    → İnsanlar & Beden
//   2 Animals & Nature → Hayvanlar & Doğa
//   3 Food & Drink     → Yiyecek & İçecek
//   4 Travel & Places  → Seyahat & Yerler
//   5 Activities       → Aktiviteler
//   6 Objects          → Nesneler
//   7 Symbols          → Semboller
//   8 Flags            → Bayraklar
const GROUP_ORDINAL_TO_TR = {
  0: "İfadeler & Duygular",
  1: "İnsanlar & Beden",
  2: "Hayvanlar & Doğa",
  3: "Yiyecek & İçecek",
  4: "Seyahat & Yerler",
  5: "Aktiviteler",
  6: "Nesneler",
  7: "Semboller",
  8: "Bayraklar",
};

// English subgroup → Turkish label. The existing emoji-data.ts already had most
// of these translated; we copy those verbatim and fill in the few that were
// still English (Country Flag, Subdivision Flag) plus a couple of cosmetic
// improvements. Script throws on any unmapped key at startup — fail loud.
const SUBGROUP_TR = {
  "Alphanum": "Alfanumerik",
  "Animal Amphibian": "Amfibyum Hayvan",
  "Animal Bird": "Kuş",
  "Animal Bug": "Böcek",
  "Animal Mammal": "Memeli Hayvan",
  "Animal Marine": "Deniz Hayvanı",
  "Animal Reptile": "Sürüngen",
  "Arrow": "Ok",
  "Arts & crafts": "El Sanatları",
  "Av Symbol": "Ses & Görüntü Sembolü",
  "Award Medal": "Ödül & Madalya",
  "Body Parts": "Vücut Parçaları",
  "Book Paper": "Kitap & Kağıt",
  "Cat Face": "Kedi Yüzü",
  "Clothing": "Giyim",
  "Computer": "Bilgisayar",
  "Country Flag": "Ülke Bayrağı",
  "Currency": "Para Birimi",
  "Dishware": "Sofra Takımı",
  "Drink": "İçecek",
  "Emotion": "Duygu",
  "Event": "Etkinlik",
  "Face Affection": "Sevgi Yüzü",
  "Face Concerned": "Endişeli Yüz",
  "Face Costume": "Kostümlü Yüz",
  "Face Glasses": "Gözlüklü Yüz",
  "Face Hand": "El İle Yüz",
  "Face Hat": "Şapkalı Yüz",
  "Face Negative": "Olumsuz Yüz",
  "Face Neutral Skeptical": "Tarafsız & Şüpheci Yüz",
  "Face Sleepy": "Uykulu Yüz",
  "Face Smiling": "Gülümseyen Yüz",
  "Face Tongue": "Dilli Yüz",
  "Face Unwell": "Keyifsiz Yüz",
  "Family": "Aile",
  "Flag": "Bayrak",
  "Food Asian": "Asya Yemeği",
  "Food Fruit": "Meyve",
  "Food Prepared": "Hazır Yemek",
  "Food Sweet": "Tatlı",
  "Food Vegetable": "Sebze",
  "Game": "Oyun",
  "Gender": "Cinsiyet",
  "Geometric": "Geometrik",
  "Hand Fingers Closed": "Kapalı Parmaklar",
  "Hand Fingers Open": "Açık Parmaklar",
  "Hand Fingers Partial": "Kısmi Parmaklar",
  "Hand Prop": "El Aleti",
  "Hand Single Finger": "Tek Parmak",
  "Hands": "Eller",
  "Heart": "Kalp",
  "Hotel": "Otel",
  "Household": "Ev Eşyası",
  "Keycap": "Tuş Karakteri",
  "Light & video": "Işık & Video",
  "Lock": "Kilit",
  "Mail": "Posta",
  "Math": "Matematik",
  "Medical": "Tıp",
  "Money": "Para",
  "Monkey Face": "Maymun Yüzü",
  "Music": "Müzik",
  "Musical Instrument": "Çalgı",
  "Office": "Ofis",
  "Other Object": "Diğer Nesne",
  "Other Symbol": "Diğer Sembol",
  "Person": "Kişi",
  "Person Activity": "Aktif Kişi",
  "Person Fantasy": "Fantezi Kişi",
  "Person Gesture": "Hareketli Yüz",
  "Person Resting": "Dinlenen Kişi",
  "Person Role": "Rol Kişi",
  "Person Sport": "Sporcu",
  "Person Symbol": "Kişi Sembolü",
  "Phone": "Telefon",
  "Place Building": "Bina",
  "Place Geographic": "Coğrafi Yer",
  "Place Map": "Harita",
  "Place Other": "Diğer Yer",
  "Place Religious": "Dini Yapı",
  "Plant Flower": "Çiçek",
  "Plant Other": "Diğer Bitki",
  "Punctuation": "Noktalama",
  "Religion": "Din",
  "Science": "Bilim",
  "Sky & weather": "Gökyüzü & Hava",
  "Sound": "Ses",
  "Sport": "Spor",
  "Subdivision Flag": "Bölge Bayrağı",
  "Time": "Zaman",
  "Tool": "Alet",
  "Transport Air": "Hava Taşıtı",
  "Transport Ground": "Kara Taşıtı",
  "Transport Sign": "Trafik İşareti",
  "Transport Water": "Deniz Taşıtı",
  "Warning": "Uyarı",
  "Writing": "Yazı",
  "Zodiac": "Burç",
};

// English country name → Turkish country name. Used for `turkishName` of
// country flags. Keyed by Unicode CLDR English name (lowercase comparison).
// Subdivision flags have a parallel small map below.
const COUNTRY_TR = {
  "Afghanistan": "Afganistan",
  "Albania": "Arnavutluk",
  "Algeria": "Cezayir",
  "American Samoa": "Amerikan Samoası",
  "Andorra": "Andorra",
  "Angola": "Angola",
  "Anguilla": "Anguilla",
  "Antarctica": "Antarktika",
  "Antigua & Barbuda": "Antigua ve Barbuda",
  "Argentina": "Arjantin",
  "Armenia": "Ermenistan",
  "Aruba": "Aruba",
  "Ascension Island": "Ascension Adası",
  "Australia": "Avustralya",
  "Austria": "Avusturya",
  "Azerbaijan": "Azerbaycan",
  "Bahamas": "Bahamalar",
  "Bahrain": "Bahreyn",
  "Bangladesh": "Bangladeş",
  "Barbados": "Barbados",
  "Belarus": "Belarus",
  "Belgium": "Belçika",
  "Belize": "Belize",
  "Benin": "Benin",
  "Bermuda": "Bermuda",
  "Bhutan": "Bhutan",
  "Bolivia": "Bolivya",
  "Bosnia & Herzegovina": "Bosna Hersek",
  "Botswana": "Botsvana",
  "Bouvet Island": "Bouvet Adası",
  "Brazil": "Brezilya",
  "British Indian Ocean Territory": "Britanya Hint Okyanusu Toprakları",
  "British Virgin Islands": "Britanya Virjin Adaları",
  "Brunei": "Brunei",
  "Bulgaria": "Bulgaristan",
  "Burkina Faso": "Burkina Faso",
  "Burundi": "Burundi",
  "Cambodia": "Kamboçya",
  "Cameroon": "Kamerun",
  "Canada": "Kanada",
  "Canary Islands": "Kanarya Adaları",
  "Cape Verde": "Yeşil Burun Adaları",
  "Caribbean Netherlands": "Karayip Hollandası",
  "Cayman Islands": "Cayman Adaları",
  "Central African Republic": "Orta Afrika Cumhuriyeti",
  "Ceuta & Melilla": "Ceuta ve Melilla",
  "Chad": "Çad",
  "Chile": "Şili",
  "China": "Çin",
  "Christmas Island": "Christmas Adası",
  "Clipperton Island": "Clipperton Adası",
  "Cocos Islands": "Cocos Adaları",
  "Colombia": "Kolombiya",
  "Comoros": "Komorlar",
  "Congo Brazzaville": "Kongo Brazzaville",
  "Congo Kinshasa": "Kongo Kinşasa",
  "Cook Islands": "Cook Adaları",
  "Costa Rica": "Kosta Rika",
  "Croatia": "Hırvatistan",
  "Cuba": "Küba",
  "Curaçao": "Curaçao",
  "Cyprus": "Kıbrıs",
  "Czechia": "Çekya",
  "Denmark": "Danimarka",
  "Diego Garcia": "Diego Garcia",
  "Djibouti": "Cibuti",
  "Dominica": "Dominika",
  "Dominican Republic": "Dominik Cumhuriyeti",
  "Ecuador": "Ekvador",
  "Egypt": "Mısır",
  "El Salvador": "El Salvador",
  "Equatorial Guinea": "Ekvator Ginesi",
  "Eritrea": "Eritre",
  "Estonia": "Estonya",
  "Eswatini": "Eswatini",
  "Ethiopia": "Etiyopya",
  "Falkland Islands": "Falkland Adaları",
  "Faroe Islands": "Faroe Adaları",
  "Fiji": "Fiji",
  "Finland": "Finlandiya",
  "France": "Fransa",
  "French Guiana": "Fransız Guyanası",
  "French Polynesia": "Fransız Polinezyası",
  "French Southern Territories": "Fransız Güney Toprakları",
  "Gabon": "Gabon",
  "Gambia": "Gambiya",
  "Georgia": "Gürcistan",
  "Germany": "Almanya",
  "Ghana": "Gana",
  "Gibraltar": "Cebelitarık",
  "Greece": "Yunanistan",
  "Greenland": "Grönland",
  "Grenada": "Grenada",
  "Guadeloupe": "Guadeloupe",
  "Guam": "Guam",
  "Guatemala": "Guatemala",
  "Guernsey": "Guernsey",
  "Guinea": "Gine",
  "Guinea Bissau": "Gine Bissau",
  "Guyana": "Guyana",
  "Haiti": "Haiti",
  "Heard & McDonald Islands": "Heard ve McDonald Adaları",
  "Honduras": "Honduras",
  "Hong Kong Sar China": "Hong Kong SAR Çin",
  "Hungary": "Macaristan",
  "Iceland": "İzlanda",
  "India": "Hindistan",
  "Indonesia": "Endonezya",
  "Iran": "İran",
  "Iraq": "Irak",
  "Ireland": "İrlanda",
  "Isle of Man": "Man Adası",
  "Israel": "İsrail",
  "Italy": "İtalya",
  "Jamaica": "Jamaika",
  "Japan": "Japonya",
  "Jersey": "Jersey",
  "Jordan": "Ürdün",
  "Kazakhstan": "Kazakistan",
  "Kenya": "Kenya",
  "Kiribati": "Kiribati",
  "Kosovo": "Kosova",
  "Kuwait": "Kuveyt",
  "Kyrgyzstan": "Kırgızistan",
  "Laos": "Laos",
  "Latvia": "Letonya",
  "Lebanon": "Lübnan",
  "Lesotho": "Lesotho",
  "Liberia": "Liberya",
  "Libya": "Libya",
  "Liechtenstein": "Lihtenştayn",
  "Lithuania": "Litvanya",
  "Luxembourg": "Lüksemburg",
  "Macao Sar China": "Makao SAR Çin",
  "Madagascar": "Madagaskar",
  "Malawi": "Malavi",
  "Malaysia": "Malezya",
  "Maldives": "Maldivler",
  "Mali": "Mali",
  "Malta": "Malta",
  "Marshall Islands": "Marshall Adaları",
  "Martinique": "Martinik",
  "Mauritania": "Moritanya",
  "Mauritius": "Mauritius",
  "Mayotte": "Mayotte",
  "Mexico": "Meksika",
  "Micronesia": "Mikronezya",
  "Moldova": "Moldova",
  "Monaco": "Monako",
  "Mongolia": "Moğolistan",
  "Montenegro": "Karadağ",
  "Montserrat": "Montserrat",
  "Morocco": "Fas",
  "Mozambique": "Mozambik",
  "Myanmar Burma": "Myanmar",
  "Namibia": "Namibya",
  "Nauru": "Nauru",
  "Nepal": "Nepal",
  "Netherlands": "Hollanda",
  "New Caledonia": "Yeni Kaledonya",
  "New Zealand": "Yeni Zelanda",
  "Nicaragua": "Nikaragua",
  "Niger": "Nijer",
  "Nigeria": "Nijerya",
  "Niue": "Niue",
  "Norfolk Island": "Norfolk Adası",
  "North Korea": "Kuzey Kore",
  "North Macedonia": "Kuzey Makedonya",
  "Northern Mariana Islands": "Kuzey Mariana Adaları",
  "Norway": "Norveç",
  "Oman": "Umman",
  "Pakistan": "Pakistan",
  "Palau": "Palau",
  "Palestinian Territories": "Filistin Toprakları",
  "Panama": "Panama",
  "Papua New Guinea": "Papua Yeni Gine",
  "Paraguay": "Paraguay",
  "Peru": "Peru",
  "Philippines": "Filipinler",
  "Pitcairn Islands": "Pitcairn Adaları",
  "Poland": "Polonya",
  "Portugal": "Portekiz",
  "Puerto Rico": "Porto Riko",
  "Qatar": "Katar",
  "Romania": "Romanya",
  "Russia": "Rusya",
  "Rwanda": "Ruanda",
  "Réunion": "Réunion",
  "Samoa": "Samoa",
  "San Marino": "San Marino",
  "Saudi Arabia": "Suudi Arabistan",
  "Senegal": "Senegal",
  "Serbia": "Sırbistan",
  "Seychelles": "Seyşeller",
  "Sierra Leone": "Sierra Leone",
  "Singapore": "Singapur",
  "Sint Maarten": "Sint Maarten",
  "Slovakia": "Slovakya",
  "Slovenia": "Slovenya",
  "Solomon Islands": "Solomon Adaları",
  "Somalia": "Somali",
  "South Africa": "Güney Afrika",
  "South Georgia & South Sandwich Islands": "Güney Georgia ve Güney Sandwich Adaları",
  "South Korea": "Güney Kore",
  "South Sudan": "Güney Sudan",
  "Spain": "İspanya",
  "Sri Lanka": "Sri Lanka",
  "St Barthélemy": "Saint Barthélemy",
  "St Helena": "Saint Helena",
  "St Kitts & Nevis": "Saint Kitts ve Nevis",
  "St Lucia": "Saint Lucia",
  "St Martin": "Saint Martin",
  "St Pierre & Miquelon": "Saint Pierre ve Miquelon",
  "St Vincent & Grenadines": "Saint Vincent ve Grenadinler",
  "Sudan": "Sudan",
  "Suriname": "Surinam",
  "Svalbard & Jan Mayen": "Svalbard ve Jan Mayen",
  "Sweden": "İsveç",
  "Switzerland": "İsviçre",
  "Syria": "Suriye",
  "São Tomé & Príncipe": "São Tomé ve Príncipe",
  "Taiwan": "Tayvan",
  "Tajikistan": "Tacikistan",
  "Tanzania": "Tanzanya",
  "Thailand": "Tayland",
  "Timor Leste": "Timor Leste",
  "Togo": "Togo",
  "Tokelau": "Tokelau",
  "Tonga": "Tonga",
  "Trinidad & Tobago": "Trinidad ve Tobago",
  "Tristan Da Cunha": "Tristan da Cunha",
  "Tunisia": "Tunus",
  "Turkey": "Türkiye",
  "Turkmenistan": "Türkmenistan",
  "Turks & Caicos Islands": "Turks ve Caicos Adaları",
  "Tuvalu": "Tuvalu",
  "U.S. Outlying Islands": "ABD Uzak Adaları",
  "U.S. Virgin Islands": "ABD Virjin Adaları",
  "Uganda": "Uganda",
  "Ukraine": "Ukrayna",
  "United Arab Emirates": "Birleşik Arap Emirlikleri",
  "United Kingdom": "Birleşik Krallık",
  "United States": "Amerika Birleşik Devletleri",
  "Uruguay": "Uruguay",
  "Uzbekistan": "Özbekistan",
  "Vanuatu": "Vanuatu",
  "Vatican City": "Vatikan",
  "Venezuela": "Venezuela",
  "Vietnam": "Vietnam",
  "Wallis & Futuna": "Wallis ve Futuna",
  "Western Sahara": "Batı Sahra",
  "Yemen": "Yemen",
  "Zambia": "Zambiya",
  "Zimbabwe": "Zimbabve",
};

// Subdivision flags (only a handful exist in Unicode 17).
const SUBDIVISION_TR = {
  England: "İngiltere",
  Scotland: "İskoçya",
  Wales: "Galler",
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { offline: false, dryRun: false, verbose: false, concurrency: DEFAULT_CONCURRENCY };
  for (const arg of argv.slice(2)) {
    if (arg === "--offline") args.offline = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--verbose" || arg === "-v") args.verbose = true;
    else if (arg.startsWith("--concurrency="))
      args.concurrency = Math.max(1, Math.min(10, Number(arg.split("=")[1])));
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(2);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/build-emoji-data.mjs [options]

Options:
  --offline            Use only cached translations; throw on uncached strings.
  --dry-run            Print unified diff vs current file; no writes.
  --verbose, -v        Log per-step progress.
  --concurrency=N      LibreTranslate concurrency (default ${DEFAULT_CONCURRENCY}, max 10).
  --help, -h           Show this help.

Env:
  LIBRETRANSLATE_URL         default: ${LT_URL}
  LIBRETRANSLATE_API_KEY     optional
`);
}

// ---------------------------------------------------------------------------
// Cache I/O (atomic)
// ---------------------------------------------------------------------------

async function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Cache at ${CACHE_PATH} is corrupt; ignoring (${err.message})`);
    return {};
  }
}

async function saveCacheAtomic(cache) {
  await mkdir(CACHE_DIR, { recursive: true });
  const tmp = `${CACHE_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(cache, null, 2), "utf8");
  await rename(tmp, CACHE_PATH);
}

async function saveRawAtomic(text) {
  await mkdir(CACHE_DIR, { recursive: true });
  const tmp = `${RAW_CACHE_PATH}.tmp`;
  await writeFile(tmp, text, "utf8");
  await rename(tmp, RAW_CACHE_PATH);
}

// ---------------------------------------------------------------------------
// Concurrency limiter (hand-rolled, no dep)
// ---------------------------------------------------------------------------

function makeLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job().finally(() => {
      active--;
      next();
    });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push(() => fn().then(resolve, reject));
      next();
    });
}

// ---------------------------------------------------------------------------
// LibreTranslate
// ---------------------------------------------------------------------------

async function translateOne(text, cache) {
  const cached = cache[text];
  if (cached !== undefined) return cached;

  const body = { q: text, source: "en", target: "tr", format: "text" };
  if (LT_KEY) body.api_key = LT_KEY;

  let lastErr = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, backoff));
    }
    try {
      const res = await fetch(`${LT_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`);
      }
      const json = await res.json();
      const tr = (json.translatedText ?? "").trim();
      if (!tr) throw new Error("empty translation");
      cache[text] = tr;
      return tr;
    } catch (err) {
      lastErr = err;
      if (err.name === "AbortError" || err.code === "UND_ERR_SOCKET")
        continue;
      throw err;
    }
  }
  throw lastErr ?? new Error("translation failed");
}

async function translateBatch(strings, opts) {
  const { cache, offline, concurrency, verbose } = opts;
  const unique = [...new Set(strings)];
  const uncached = unique.filter((s) => cache[s] === undefined);

  if (uncached.length === 0) {
    if (verbose) console.log(`  cache hit: ${unique.length} strings (no network)`);
    return strings.map((s) => cache[s]);
  }

  if (offline) {
    throw new Error(
      `--offline but ${uncached.length} string(s) uncached. First missing: "${uncached[0]}".`,
    );
  }

  if (verbose) {
    console.log(`  translating ${uncached.length} unique string(s) (cache miss)`);
  }

  const limit = makeLimiter(concurrency);
  let done = 0;
  let failed = 0;
  const failedSamples = [];
  await Promise.all(
    uncached.map((s) =>
      limit(async () => {
        try {
          await translateOne(s, cache);
        } catch (err) {
          failed++;
          if (failedSamples.length < 5) failedSamples.push(s);
          if (verbose) console.warn(`    ! translate failed for "${s}": ${err.message}`);
        } finally {
          done++;
          if (verbose && done % 100 === 0) {
            console.log(`    ${done}/${uncached.length}`);
          }
        }
      }),
    ),
  );

  if (failed > 0) {
    console.warn(
      `  ${failed} string(s) failed to translate; falling back to identity (English).`,
    );
    for (const s of failedSamples) console.warn(`    - "${s}"`);
  }

  return strings.map((s) => cache[s] ?? s);
}

// ---------------------------------------------------------------------------
// Parse + filter emoji-test.txt
// ---------------------------------------------------------------------------

async function fetchEmojiTestText({ offline, verbose }) {
  if (existsSync(RAW_CACHE_PATH)) {
    if (verbose) console.log(`  using cached ${RAW_CACHE_PATH}`);
    return readFile(RAW_CACHE_PATH, "utf8");
  }
  if (offline) throw new Error(`--offline but no cached ${RAW_CACHE_PATH}`);
  if (verbose) console.log(`  fetching ${UNICODE_EMOJI_TEST_URL}`);
  const res = await fetch(UNICODE_EMOJI_TEST_URL, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
  const text = await res.text();
  await saveRawAtomic(text);
  return text;
}

function parseEmojiTest(text) {
  // Group ordinal is determined by the `# group: <Name>` comments in
  // the order they appear in the file. Unicode's order:
  //   0 Smileys & Emotion, 1 People & Body, 2 Animals & Nature,
  //   3 Food & Drink, 4 Travel & Places, 5 Activities, 6 Objects,
  //   7 Symbols, 8 Flags.
  // A trailing "Component" group exists for skin-tone modifiers and similar;
  // we skip it entirely (those rows are not standalone emojis).
  const groupOrder = [
    "Smileys & Emotion",
    "People & Body",
    "Animals & Nature",
    "Food & Drink",
    "Travel & Places",
    "Activities",
    "Objects",
    "Symbols",
    "Flags",
  ];

  let currentGroupOrdinal = 0;
  let currentSubgroup = null;
  let inSkippedGroup = false;
  const rows = [];

  for (const line of text.split("\n")) {
    if (line.startsWith("# group: ")) {
      const name = line.slice("# group: ".length).trim();
      const idx = groupOrder.indexOf(name);
      inSkippedGroup = idx === -1;
      if (!inSkippedGroup) {
        currentGroupOrdinal = idx;
        currentSubgroup = null;
      }
      continue;
    }
    if (inSkippedGroup) continue;
    if (line.startsWith("# subgroup: ")) {
      // emoji-test.txt uses kebab-case; convert to Title Case to match the
      // existing emoji-data.ts format and the SUBGROUP_TR lookup keys.
      currentSubgroup = kebabToSubGroup(line.slice("# subgroup: ".length).trim());
      continue;
    }
    if (!line.trim() || line.startsWith("#")) continue;

    const parts = line.split(";");
    if (parts.length < 2) continue;
    const codepoints = parts[0].trim();
    const rest = parts[1].trim();
    const hashIdx = rest.indexOf("#");
    if (hashIdx === -1) continue;
    const qualifier = rest.slice(0, hashIdx).trim();
    if (qualifier !== "fully-qualified") continue;
    // Name field looks like `😀 E1.0 grinning face`. Strip the leading emoji
    // character(s) and the `E<version>` token so we get the clean English name.
    const rawName = rest.slice(hashIdx + 1).trim();
    const char = codepoints
      .split(/\s+/)
      .map((cp) => String.fromCodePoint(parseInt(cp, 16)))
      .join("");
    // Drop everything up to and including ` E<digits>(.<digits>)? `.
    const unicodeName = rawName.replace(/^.+? E\d+(?:\.\d+)? /, "").trim();
    rows.push({
      char,
      unicodeName,
      groupOrdinal: currentGroupOrdinal,
      subgroup: currentSubgroup,
    });
  }

  return rows;
}

function isSkinToneModifier(cp) {
  const n = cp.codePointAt(0);
  return n >= 0x1f3fb && n <= 0x1f3ff;
}

function hasSkinTone(char) {
  for (const cp of char) if (isSkinToneModifier(cp)) return true;
  return false;
}

// Returns true for gendered ZWJ variants (e.g., `man: beard`, `woman: red hair`,
// `man gesturing NO`). Does NOT match country-flag names like "flag: Isle of Man"
// (those have a colon too, but are not gendered — the gendered word appears
// after a colon *and* the char contains a ZWJ).
function isGenderedVariant(char, unicodeName) {
  if (!char.includes("‍")) return false;
  return /^(man|woman|male|female):/i.test(unicodeName);
}

// Drop ZWJ sequences entirely — the existing emoji-data.ts has none. ZWJ
// sequences in emoji-test.txt include face-with-modifier combos, family
// groups, gender+modifier combos, etc., all of which the existing dataset
// treats as non-base.
function hasZwj(char) {
  return char.includes("‍");
}

// Convert Unicode kebab-case subgroup (`person-role`) to the Title Case used
// in the existing emoji-data.ts file (`Person Role`). A few entries had
// intentional lowercase in the original file — match those exactly via the
// override map. Unicode subgroup labels keep their original `&` + space
// separators (e.g., `sky & weather`, `light & video`).
const SUBGROUP_KEBAB_OVERRIDES = {
  "sky & weather": "Sky & weather",
  "light & video": "Light & video",
  "arts & crafts": "Arts & crafts",
};

function kebabToSubGroup(kebab) {
  const override = SUBGROUP_KEBAB_OVERRIDES[kebab];
  if (override) return override;
  return kebab
    .split(/[- ]/)
    .map((w) => (w === "&" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function filterBaseEmojos(rows) {
  return rows.filter((r) => {
    if (hasSkinTone(r.char)) return false;
    if (hasZwj(r.char)) return false;
    if (isGenderedVariant(r.char, r.unicodeName)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Build each entry
// ---------------------------------------------------------------------------

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase("tr-TR"));
}

function extractFlagCountry(unicodeName) {
  // Unicode names are "flag: <Country>". Be tolerant of casing.
  const m = unicodeName.match(/^flag:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

function buildEntries(parsed, translations, { verbose }) {
  // translations is a function (englishString) => turkishString.
  const out = [];
  let usedEnglishNameFallback = 0;
  let emptyTerms = 0;

  for (const r of parsed) {
    const group = GROUP_ORDINAL_TO_TR[r.groupOrdinal];
    if (!group) throw new Error(`Missing TR group for ordinal ${r.groupOrdinal}`);
    const subGroupLabel = SUBGROUP_TR[r.subgroup];
    if (!subGroupLabel) {
      throw new Error(
        `Missing TR subGroupLabel for "${r.subgroup}". ` +
          `Add it to SUBGROUP_TR in scripts/build-emoji-data.mjs.`,
      );
    }

    const flagCountry = extractFlagCountry(r.unicodeName);
    const isFlag = flagCountry !== null;
    const isSubdivisionFlag =
      isFlag && r.subgroup === "Subdivision Flag";

    let englishName;
    if (isFlag) englishName = `Flag: ${flagCountry}`;
    else englishName = titleCase(r.unicodeName);

    let turkishName;
    if (isSubdivisionFlag) {
      turkishName = `Bayrak: ${SUBDIVISION_TR[flagCountry] ?? flagCountry}`;
    } else if (isFlag) {
      const trCountry = COUNTRY_TR[flagCountry] ?? translations(flagCountry);
      turkishName = `Bayrak: ${trCountry}`;
    } else {
      turkishName = titleCase(translations(r.unicodeName));
    }

    // emojilib v3 is keyed by emoji character; the value is an array of
    // keywords. Skip for flags (we synthesize a "bayrak: …" term) and for
    // emojis emojilib doesn't know about (newer Unicode releases).
    const libKeywords = emojiLib[r.char];
    let terms;
    if (Array.isArray(libKeywords) && libKeywords.length > 0) {
      const translatedTerms = translations.many(
        libKeywords.slice(0, TOP_TERMS * 2),
      ).map((t) => t.toLowerCase().trim());
      const seen = new Set();
      terms = [];
      for (const t of translatedTerms) {
        if (!t) continue;
        if (seen.has(t)) continue;
        seen.add(t);
        terms.push(t);
        if (terms.length >= TOP_TERMS) break;
      }
      if (isFlag && !terms.some((t) => t.includes("bayrak"))) {
        const synthetic = isSubdivisionFlag
          ? `bayrak: ${(SUBDIVISION_TR[flagCountry] ?? flagCountry).toLowerCase()}`
          : `bayrak: ${(COUNTRY_TR[flagCountry] ?? flagCountry).toLowerCase()}`;
        if (!seen.has(synthetic)) {
          terms.unshift(synthetic);
          terms = terms.slice(0, TOP_TERMS);
        }
      }
    } else {
      terms = [];
      emptyTerms++;
    }

    if (!isFlag && turkishName === englishName) usedEnglishNameFallback++;

    out.push({
      character: r.char,
      englishName,
      turkishName,
      group,
      subGroup: r.subgroup,
      subGroupLabel,
      terms,
    });
  }

  if (verbose) {
    console.log(`  ${out.length} entries built`);
    if (emptyTerms > 0) console.log(`  ${emptyTerms} entries have empty terms (emojilib gap)`);
    if (usedEnglishNameFallback > 0)
      console.log(`  ${usedEnglishNameFallback} entries kept English name (no translation)`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Output formatting (preserves existing file shape exactly)
// ---------------------------------------------------------------------------

function singleQuoteEscape(s) {
  // Single-quote escape — the only escape the existing file uses.
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function formatEntry(row) {
  const fields = [
    `character: '${singleQuoteEscape(row.character)}'`,
    `turkishName: '${singleQuoteEscape(row.turkishName)}'`,
    `englishName: '${singleQuoteEscape(row.englishName)}'`,
    `group: '${singleQuoteEscape(row.group)}'`,
    `subGroup: '${singleQuoteEscape(row.subGroup)}'`,
    `subGroupLabel: '${singleQuoteEscape(row.subGroupLabel)}'`,
    `terms: [${
      row.terms.length === 0
        ? ""
        : row.terms.map((t) => `'${singleQuoteEscape(t)}'`).join(", ")
    }]`,
  ];
  return `  { ${fields.join(", ")} },`;
}

function formatFile(rows) {
  // Preserve the existing header + types verbatim so the file's public shape
  // is byte-identical to before; only the array contents change.
  const header = `// AUTO-GENERATED. Do not edit by hand — re-run scripts/build-emoji-data.mjs
// to regenerate from Unicode emoji-test.txt + emojilib.
// ${rows.length} base emojis across ${Object.keys(GROUP_ORDINAL_TO_TR).length} groups (skin-tone / gender variants filtered out).

export type EmojiGroup =
  | "Yiyecek & İçecek"
  | "İfadeler & Duygular"
  | "İnsanlar & Beden"
  | "Hayvanlar & Doğa"
  | "Seyahat & Yerler"
  | "Aktiviteler"
  | "Nesneler"
  | "Semboller"
  | "Bayraklar";

export type EnrichedEmoji = {
  character: string;
  turkishName: string;
  englishName: string;
  group: EmojiGroup;
  subGroup: string;
  subGroupLabel: string;
  terms: string[];
};

// Widening \`group\` to \`string\` (instead of the \`EmojiGroup\` literal union)
// keeps the array element type inferred cleanly — otherwise TS hits the
// "union type too complex" error when reading 1600+ literal entries. The
// \`EnrichedEmoji\` type above remains the canonical shape for callers.
export const EMOJI_DATA: ReadonlyArray<{
  character: string;
  turkishName: string;
  englishName: string;
  group: string;
  subGroup: string;
  subGroupLabel: string;
  terms: string[];
}> = [
`;

  const body = rows.map(formatEntry).join("\n");
  return header + body + "\n];\n";
}

// ---------------------------------------------------------------------------
// Diff helper (for --dry-run)
// ---------------------------------------------------------------------------

function unifiedDiff(oldText, newText) {
  // Minimal line-by-line diff; good enough for human inspection.
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const max = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) {
      if (a[i] !== undefined) out.push(`- ${a[i]}`);
      if (b[i] !== undefined) out.push(`+ ${b[i]}`);
    }
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  const v = args.verbose;
  const log = (...m) => v && console.log(...m);

  console.log(`build-emoji-data.mjs ${args.dryRun ? "(dry run) " : ""}started`);
  log(`  LT_URL=${LT_URL}`);
  log(`  LT_KEY=${LT_KEY ? "set" : "not set"}`);
  log(`  concurrency=${args.concurrency}, offline=${args.offline}, dryRun=${args.dryRun}`);

  // 1) Emoji-test.txt
  log(`[1/5] emoji-test.txt`);
  const rawText = await fetchEmojiTestText(args);
  const parsed = parseEmojiTest(rawText);
  log(`  parsed ${parsed.length} fully-qualified emojis`);

  // 2) Filter to base
  log(`[2/5] filtering`);
  const base = filterBaseEmojos(parsed);
  log(`  ${base.length} base emojis (after filter)`);
  // The historical baseline was 1663 (Unicode 17.0 with ♀️/♂️ filtered as
  // text-style variants). Modern Unicode may add 2–10 more emoji-presentation
  // base symbols (gender signs, etc.) on each version bump; that's expected.
  if (base.length < 1500 || base.length > 1800) {
    console.warn(
      `  WARNING: base count ${base.length} outside expected 1500-1800 range; check filters.`,
    );
  }

  // 3) Collect all strings needing translation, translate once.
  log(`[3/5] translation`);
  const cache = await loadCache();
  if (Object.keys(cache).length === 0 && !LT_KEY && !args.offline) {
    console.warn(
      `  note: cache is empty and LIBRETRANSLATE_API_KEY is not set.\n` +
        `        public libretranslate.com rate-limits aggressively; for a clean first run, set\n` +
        `        LIBRETRANSLATE_URL to a self-hosted instance (docker run -p 5000:5000 libretranslate/libretranslate)\n` +
        `        or use a key. The script will fall back to identity (English) on failure.`,
    );
  }

  const allStrings = new Set();
  for (const r of base) {
    if (!extractFlagCountry(r.unicodeName)) {
      allStrings.add(r.unicodeName);
    } else {
      const c = extractFlagCountry(r.unicodeName);
      if (!COUNTRY_TR[c]) allStrings.add(c);
    }
    const libKeywords = emojiLib[r.char];
    if (Array.isArray(libKeywords)) {
      for (const k of libKeywords.slice(0, TOP_TERMS * 2)) allStrings.add(k);
    }
  }

  const strings = [...allStrings];
  await translateBatch(strings, {
    cache,
    offline: args.offline,
    concurrency: args.concurrency,
    verbose: v,
  });

  if (!args.dryRun) await saveCacheAtomic(cache);
  log(`  cache size: ${Object.keys(cache).length} entries`);

  // 4) Build entries
  log(`[4/5] assembling entries`);
  const entries = buildEntries(base, makeTranslator(cache), args);

  // 5) Format + write (or diff)
  log(`[5/5] formatting output`);
  const newText = formatFile(entries);
  let oldText = "";
  if (existsSync(OUTPUT_PATH)) oldText = await readFile(OUTPUT_PATH, "utf8");

  if (args.dryRun) {
    console.log("\n--- diff (truncated to first 80 lines) ---");
    console.log(unifiedDiff(oldText, newText).split("\n").slice(0, 80).join("\n"));
    return;
  }

  const tmp = `${OUTPUT_PATH}.tmp`;
  await writeFile(tmp, newText, "utf8");
  await rename(tmp, OUTPUT_PATH);
  console.log(`\nWrote ${OUTPUT_PATH} (${entries.length} entries, ${newText.length} bytes)`);
}

function makeTranslator(cache) {
  const fn = (s) => cache[s] ?? s;
  fn.many = (arr) => arr.map((s) => cache[s] ?? s);
  return fn;
}

// ---------------------------------------------------------------------------
// Entry guard
// ---------------------------------------------------------------------------

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(path.basename(process.argv[1] ?? ""));
if (isMain) {
  main().catch((err) => {
    console.error("\nbuild-emoji-data.mjs failed:", err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  });
}

export { main, parseEmojiTest, filterBaseEmojos, formatFile, buildEntries };