import { SCHEMES } from '../data/schemes';

const SCHEME_LIST_FOR_AI = SCHEMES.map(s =>
  `ID:${s.id} | নাম:${s.name} | ক্যাটাগরি:${s.category} | যোগ্যতা:${s.eligibility.join(', ')}`
).join('\n');

export async function matchSchemesAI(transcript, apiKey, profile = {}) {
  if (!transcript) return { schemes: [], message: null };

  const profileText = Object.keys(profile).length > 0
    ? `লিঙ্গ=${profile.gender||'অজানা'}, বয়স=${profile.ageGroup||'অজানা'}, পেশা=${profile.occupation||'অজানা'}, জেলা=${profile.district||'অজানা'}`
    : '';

  const systemPrompt = `তুমি পশ্চিমবঙ্গ সরকারি স্কিম বিশেষজ্ঞ।

উপলব্ধ স্কিম:
${SCHEME_LIST_FOR_AI}

শুধু এই JSON format এ উত্তর দাও, অন্য কিছু লিখবে না:
{"matched_ids":[1,2],"understood":"১ লাইন বাংলায়","message":null}

যদি কোনো স্কিম না মেলে:
{"matched_ids":[],"understood":"সারাংশ","message":"দুঃখিত, এই বিষয়ে আমাদের কাছে এখনো স্কিম নেই।"}

নিয়ম:
- এলাকা/পঞ্চায়েত/অঞ্চল/গ্রাম/ব্লক/location → সব ID [1,2,3,4,5,6,7,8]
- কৃষক/জমি/চাষ/ধান/ফসল → [2,3,5]
- বিধবা → [4,5]
- মহিলা/মেয়ে/নারী → [1,4,5]
- ছাত্র/পড়া/স্কুল/কলেজ/বিশ্ববিদ্যালয় → [6,8,5]
- বয়স্ক/বৃদ্ধ/৬০/৬৫/৭০ → [7,5]
- স্বাস্থ্য/হাসপাতাল/চিকিৎসা/অসুস্থ → [5]
- গরিব/বিপিএল → [1,2,4,5,7]
- সবসময় ID 5 রাখো`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `"${transcript}" ${profileText}` }
        ],
      }),
    });

    const data = await res.json();
    const raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    return {
      schemes: SCHEMES
        .filter(s => parsed.matched_ids?.includes(s.id))
        .map(s => ({ ...s, score: 10 })),
      understood: parsed.understood || null,
      message: parsed.message || null,
    };

  } catch (err) {
    console.error('OpenAI error:', err);
    // API fail হলে keyword fallback
    return {
      schemes: fallbackMatch(transcript),
      understood: null,
      message: null,
    };
  }
}

// API fail হলে এটা কাজ করবে
function fallbackMatch(transcript) {
  const text = transcript.toLowerCase();
  return SCHEMES.filter(s => {
    if (text.includes('কৃষক') || text.includes('জমি')) return s.category === 'কৃষক';
    if (text.includes('বিধবা')) return s.category === 'বিধবা';
    if (text.includes('ছাত্র') || text.includes('পড়া')) return s.category === 'ছাত্র';
    if (text.includes('বয়স্ক') || text.includes('বৃদ্ধ')) return s.category === 'বয়স্ক';
    return s.id === 5;
  }).map(s => ({ ...s, score: 5 }));
}

export function calcTotalBenefits(schemes) {
  return schemes.reduce((sum, s) => sum + s.amountNum, 0);
}

export function formatBengaliNumber(num) {
  if (num >= 100000) return `${(num / 100000).toFixed(1)} লক্ষ`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} হাজার`;
  return num.toString();
}