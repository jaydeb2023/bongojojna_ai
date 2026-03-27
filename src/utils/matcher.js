import { SCHEMES } from '../data/schemes';

// Known WB districts, blocks, panchayats (partial list for matching)
const WB_LOCATIONS = [
  'নগেন্দ্রপুর', 'বারুইপুর', 'ক্যানিং', 'ডায়মন্ড হারবার', 'মথুরাপুর',
  'কলকাতা', 'মালদা', 'মুর্শিদাবাদ', 'বীরভূম', 'বর্ধমান', 'হাওড়া',
  'হুগলি', 'নদিয়া', 'পুরুলিয়া', 'বাঁকুড়া', 'মেদিনীপুর', 'জলপাইগুড়ি',
  'দার্জিলিং', 'কোচবিহার', 'দিনাজপুর', 'আসানসোল', 'দুর্গাপুর',
  'খড়্গপুর', 'শিলিগুড়ি', 'বহরামপুর', 'কৃষ্ণনগর', 'বনগাঁ',
];

// Parse Bengali voice input and match schemes
export function matchSchemes(transcript, profile = {}) {
  if (!transcript && Object.keys(profile).length === 0) return [];

  const text = (transcript || '').toLowerCase();
  const matched = [];

  // Detect if location-based query (panchayat/anchal/gram)
  const isLocationQuery = 
    text.includes('পঞ্চায়েত') ||
    text.includes('অঞ্চল') ||
    text.includes('গ্রাম') ||
    text.includes('ব্লক') ||
    text.includes('এলাকা') ||
    WB_LOCATIONS.some(loc => text.includes(loc.toLowerCase()));

  SCHEMES.forEach(scheme => {
    let score = 0;

    // Location query → show ALL schemes available in WB
    if (isLocationQuery) {
      score += 2; // base score for all WB schemes
    }

    // Gender matching
    if (text.includes('মহিলা') || text.includes('মেয়ে') || text.includes('নারী') || profile.gender === 'মহিলা') {
      if (scheme.category === 'মহিলা' || scheme.category === 'বিধবা') score += 3;
    }

    // Widow matching
    if (text.includes('বিধবা') || profile.maritalStatus === 'বিধবা') {
      if (scheme.category === 'বিধবা') score += 5;
    }

    // Farmer matching
    if (text.includes('কৃষক') || text.includes('চাষ') || text.includes('জমি') || text.includes('ধান') || text.includes('ফসল') || profile.occupation === 'কৃষক') {
      if (scheme.category === 'কৃষক') score += 4;
    }

    // Student matching
    if (text.includes('ছাত্র') || text.includes('ছাত্রী') || text.includes('পড়া') || text.includes('স্কুল') || text.includes('কলেজ') || text.includes('বিশ্ববিদ্যালয়') || profile.occupation === 'ছাত্র') {
      if (scheme.category === 'ছাত্র') score += 4;
    }

    // Elder matching
    if (text.includes('বৃদ্ধ') || text.includes('বয়স্ক') || text.includes('৬০') || text.includes('৬৫') || text.includes('৭০') || text.includes('বুড়ো') || profile.ageGroup === '৬০+') {
      if (scheme.category === 'বয়স্ক') score += 4;
    }

    // Health matching
    if (text.includes('অসুস্থ') || text.includes('হাসপাতাল') || text.includes('চিকিৎসা') || text.includes('ডাক্তার') || text.includes('ওষুধ')) {
      if (scheme.category === 'স্বাস্থ্য') score += 4;
    }

    // BPL / poor family
    if (text.includes('গরিব') || text.includes('বিপিএল') || text.includes('bpl') || profile.income?.includes('BPL')) {
      score += 1;
    }

    // Universal schemes (everyone can get)
    if (scheme.id === 5) score += 1; // Swasthya Sathi for all WB residents

    if (score > 0) {
      matched.push({ ...scheme, score });
    }
  });

  // If location query but no specific category matched, show all WB schemes
  if (isLocationQuery && matched.length === 0) {
    return SCHEMES.map(s => ({ ...s, score: 1 }));
  }

  // Sort by score descending
  return matched.sort((a, b) => b.score - a.score);
}

// Calculate total benefits
export function calcTotalBenefits(schemes) {
  return schemes.reduce((sum, s) => sum + s.amountNum, 0);
}

// Format number in Bengali
export function formatBengaliNumber(num) {
  if (num >= 100000) return `${(num / 100000).toFixed(1)} লক্ষ`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} হাজার`;
  return num.toString();
}

