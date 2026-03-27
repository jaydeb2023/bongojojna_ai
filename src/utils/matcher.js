// src/utils/matcher.js

// Live schemes cache
let liveSchemes = [];
let schemesFetchedAt = 0;
const CACHE_MS = 6 * 60 * 60 * 1000;

// ── Fetch live schemes from Vercel API ───────────────────
export async function fetchSchemes() {
  if (liveSchemes.length && Date.now() - schemesFetchedAt < CACHE_MS) {
    return liveSchemes;
  }
  try {
    const res = await fetch('/api/schemes');
    const data = await res.json();
    liveSchemes = data.schemes || [];
    schemesFetchedAt = Date.now();
    console.log(`✅ Loaded ${liveSchemes.length} schemes (${data.source})`);
    return liveSchemes;
  } catch (e) {
    console.error('fetchSchemes failed:', e);
    return liveSchemes;
  }
}

// ── Main AI matcher ──────────────────────────────────────
export async function matchSchemesAI(text, apiKey) {
  if (!text) return { schemes: [], understood: null, message: null };

  // 1. Get live schemes
  const schemes = await fetchSchemes();
  if (!schemes.length) {
    return { schemes: [], understood: null, message: 'স্কিম লোড হচ্ছে, একটু অপেক্ষা করুন।' };
  }

  // 2. Build scheme summary for OpenAI
  const schemeList = schemes.map(s =>
    `ID:${s.id}|${s.name}|${s.category}|${s.eligibility?.join?.(',') || ''}|${s.amount}`
  ).join('\n');

  const systemPrompt = `তুমি পশ্চিমবঙ্গ সরকারি স্কিম বিশেষজ্ঞ। ব্যবহারকারী বাংলায় কথা বলে।

উপলব্ধ স্কিম:
${schemeList}

নিয়ম:
- এলাকা/পঞ্চায়েত/অঞ্চল/গ্রাম/ব্লক/location জিজ্ঞেস করলে → সেই এলাকার সব প্রযোজ্য স্কিম দেখাও
- নির্দিষ্ট ব্যক্তি (বিধবা/কৃষক/ছাত্র/বয়স্ক) → শুধু তার স্কিম
- কোনো স্কিম না থাকলে message এ বাংলায় জানাও
- সবসময় স্বাস্থ্যসাথী (ID:5) রাখো

শুধু এই JSON দাও, অন্য কিছু না:
{"matched_ids":[1,2,5],"understood":"এক লাইন বাংলায়","message":null}

স্কিম না থাকলে:
{"matched_ids":[],"understood":"সারাংশ","message":"দুঃখিত, এই বিষয়ে আমাদের কাছে এখনো কোনো স্কিম নেই। তবে স্বাস্থ্যসাথীর জন্য আবেদন করতে পারেন।"}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `"${text}"` },
        ],
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    const matched = schemes.filter(s => parsed.matched_ids?.includes(s.id));

    // যদি কোনো match না হয়
    if (matched.length === 0 && !parsed.message) {
      parsed.message = 'এই বিষয়ে নির্দিষ্ট স্কিম পাইনি। আরও বিস্তারিত বলুন — যেমন বয়স, পেশা, জেলা।';
    }

    return {
      schemes: matched,
      understood: parsed.understood || null,
      message: parsed.message || null,
    };

  } catch (err) {
    console.error('OpenAI error:', err.message);
    // Fallback
    return {
      schemes: fallback(text, schemes),
      understood: null,
      message: null,
    };
  }
}

// ── Keyword fallback যদি OpenAI fail করে ────────────────
function fallback(text, schemes) {
  const t = text.toLowerCase();
  const isLocation = t.includes('পঞ্চায়েত') || t.includes('অঞ্চল') || t.includes('গ্রাম') || t.includes('এলাকা') || t.includes('ব্লক');
  if (isLocation) return schemes;

  return schemes.filter(s => {
    const cat = s.category || '';
    if ((t.includes('বিধবা')) && cat === 'বিধবা') return true;
    if ((t.includes('কৃষক') || t.includes('জমি') || t.includes('চাষ')) && cat === 'কৃষক') return true;
    if ((t.includes('ছাত্র') || t.includes('পড়া') || t.includes('স্কুল')) && cat === 'ছাত্র') return true;
    if ((t.includes('বয়স্ক') || t.includes('বৃদ্ধ')) && cat === 'বয়স্ক') return true;
    if ((t.includes('মহিলা') || t.includes('মেয়ে')) && cat === 'মহিলা') return true;
    if (s.id === 5) return true;
    return false;
  });
}

export function calcTotalBenefits(schemes) {
  return schemes.reduce((sum, s) => sum + (s.amountNum || 0), 0);
}