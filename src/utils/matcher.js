// utils/matcher.js - OpenAI AI + Live schemes
let cachedSchemes = [];
let cacheTime = 0;

export async function matchSchemesAI(text, apiKey) {
  // Cache schemes 24hr
  const now = Date.now();
  if (!cachedSchemes.length || now - cacheTime > 24 * 60 * 60 * 1000) {
    cachedSchemes = await fetchLiveSchemes();
    cacheTime = now;
  }

  const profile = parseUserProfile(text);
  const matched = await openaiMatch(profile, cachedSchemes, apiKey);
  
  return {
    schemes: matched.slice(0, 8),
    understood: `${profile.age || '?'} বছর, ${profile.gender || 'অজানা'}, ${profile.location || 'অজানা'}, ${profile.occupation || ''}`.trim(),
    message: getAIMessage(profile, matched)
  };
}

export function calcTotalBenefits(schemes) {
  return schemes.reduce((total, scheme) => {
    return total + (scheme.amount || 0);
  }, 0);
}

// OpenAI GPT-4o-mini দিয়ে intelligent matching
async function openaiMatch(profile, schemes, apiKey) {
  const prompt = `
তোমার কাজ: ব্যবহারকারীর প্রোফাইলের সাথে স্কিম ম্যাচ করো।

ব্যবহারকারী: ${JSON.stringify(profile)}
স্কিমস (৫০টি): ${JSON.stringify(schemes.slice(0, 50))}

নিয়ম:
1. বয়স, লিঙ্গ, লোকেশন, পেশা ম্যাচ করো
2. প্রতিটি স্কিমের score দাও (0.1-1.0)
3. শুধুমাত্র relevant স্কিম রাখো
4. WB + Central schemes prioritize করো

ফরম্যাট (JSON array):
[
  {"id": 1, "name": "লক্ষ্মীর ভাণ্ডার", "score": 0.95, "reason": "বিধবা মহিলা"},
  ...
]

শুধু JSON দাও, কোন explanation নয়।
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // সস্তা + দ্রুত
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // JSON extract করো
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return fallbackMatch(profile, schemes);
  } catch (error) {
    console.error('OpenAI failed:', error);
    return fallbackMatch(profile, schemes);
  }
}

function fallbackMatch(profile, schemes) {
  return schemes
    .filter(scheme => {
      const score = calculateScore(profile, scheme);
      return score > 0.3;
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8)
    .map(scheme => ({
      ...scheme,
      score: calculateScore(profile, scheme)
    }));
}

function parseUserProfile(text) {
  const lowerText = text.toLowerCase();
  
  // বয়স
  const ageMatch = lowerText.match(/(\d{1,2})\s*(বছর|বছোর|year|yrs)/);
  const age = ageMatch ? parseInt(ageMatch[1]) : null;
  
  // লিঙ্গ
  const genderMatch = lowerText.match(/(মহিলা|মেয়ে|বিধবা|ছেলে|পুরুষ|মানুষ)/i);
  const gender = genderMatch ? genderMatch[1] : null;
  
  // লোকেশন
  const locationMatch = lowerText.match(/(মালদা|বর্ধমান|হাওড়া|কলকাতা|দমদম|পূর্ববর্ধমান|মুর্শিদাবাদ)/i);
  const location = locationMatch ? locationMatch[1] : null;
  
  // পেশা
  const occupation = lowerText.includes('কৃষক') ? 'কৃষক' :
                    lowerText.includes('ছাত্র') ? 'ছাত্র' :
                    lowerText.includes('মেয়ে') ? 'ছাত্রী' : null;

  return {
    age,
    gender,
    location,
    occupation,
    rawText: text
  };
}

function getAIMessage(profile, matched) {
  if (matched.length === 0) {
    return 'আরো বিস্তারিত তথ্য দিন (যেমন: বয়স, জমির পরিমাণ, পরিবারের আয়)';
  }
  
  if (profile.age && profile.age > 60) {
    return '৬০+ বয়সের জন্য বেশি সুবিধা আছে! আবেদন করুন।';
  }
  
  return null;
}

function calculateScore(profile, scheme) {
  let score = 0;
  
  if (profile.gender === 'মহিলা' && scheme.category?.includes('women')) score += 0.4;
  if (profile.occupation === 'কৃষক' && scheme.category?.includes('farmer')) score += 0.5;
  if (profile.age && profile.age > 60 && scheme.eligibility?.includes('বৃদ্ধ')) score += 0.3;
  
  return Math.min(score, 1.0);
}