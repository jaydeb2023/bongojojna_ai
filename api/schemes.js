// api/schemes.js - Vercel Serverless Function
// myScheme.gov.in থেকে live data আনবে, 6 ঘণ্টা cache করবে

let cache = null;
let cacheTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Cache valid হলে cache থেকে দাও
  if (cache && Date.now() - cacheTime < CACHE_DURATION) {
    return res.status(200).json({ schemes: cache, source: 'cache' });
  }

  try {
    // myScheme.gov.in official API
    const response = await fetch(
      'https://api.myscheme.gov.in/search/v4/schemes?lang=bn&keyword=&state=West+Bengal&page=1&size=50',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BongoJojna/1.0',
        }
      }
    );

    if (!response.ok) throw new Error('myScheme API failed');

    const data = await response.json();
    const rawSchemes = data?.data?.schemes || data?.schemes || [];

    // Normalize করো
    const schemes = rawSchemes.map((s, i) => ({
      id: s.schemeId || s.id || i + 1,
      name: s.schemeName?.bn || s.schemeName?.en || s.name || 'অজানা স্কিম',
      nameEn: s.schemeName?.en || s.name || '',
      description: s.shortDescription?.bn || s.shortDescription?.en || s.description || '',
      amount: extractAmount(s),
      amountNum: extractAmountNum(s),
      category: mapCategory(s),
      eligibility: extractEligibility(s),
      applyLink: s.applicationProcess?.applyLink || s.applyLink || 'https://myscheme.gov.in',
      documents: extractDocuments(s),
      deadline: s.deadline || 'সারা বছর',
      ministry: s.ministry || s.department || 'সরকার',
      icon: getCategoryIcon(mapCategory(s)),
      color: getCategoryColor(mapCategory(s)),
      beneficiaries: s.beneficiaries || '',
      active: true,
      source: 'live',
    }));

    cache = schemes;
    cacheTime = Date.now();

    return res.status(200).json({ schemes, source: 'live', total: schemes.length });

  } catch (error) {
    console.error('Live API failed:', error.message);

    // Fallback — hardcoded WB schemes
    const fallback = getWBSchemes();
    return res.status(200).json({ schemes: fallback, source: 'fallback', total: fallback.length });
  }
}

// ── Helper functions ──────────────────────────────────────

function extractAmount(s) {
  if (s.benefit?.amount) return `₹${s.benefit.amount}`;
  if (s.financialAssistance) return s.financialAssistance;
  if (s.amount) return `₹${s.amount}`;
  return 'পরিবর্তনশীল';
}

function extractAmountNum(s) {
  const raw = s.benefit?.amount || s.amount || 0;
  return typeof raw === 'number' ? raw : parseInt(raw.toString().replace(/[^\d]/g, '')) || 0;
}

function extractEligibility(s) {
  const eli = [];
  if (s.eligibility?.gender) eli.push(s.eligibility.gender);
  if (s.eligibility?.age) eli.push(s.eligibility.age);
  if (s.eligibility?.income) eli.push(s.eligibility.income);
  if (s.state) eli.push(s.state);
  return eli.length ? eli : ['পশ্চিমবঙ্গ বাসিন্দা'];
}

function extractDocuments(s) {
  if (Array.isArray(s.documents)) return s.documents.slice(0, 4);
  return ['আধার কার্ড', 'ব্যাংক পাসবুক'];
}

function mapCategory(s) {
  const name = (s.schemeName?.en || s.name || '').toLowerCase();
  const tags = (s.tags || []).join(' ').toLowerCase();
  const combined = name + ' ' + tags;
  if (combined.includes('woman') || combined.includes('widow') || combined.includes('girl') || combined.includes('mahila')) return 'মহিলা';
  if (combined.includes('farmer') || combined.includes('krishi') || combined.includes('krishak') || combined.includes('agricult')) return 'কৃষক';
  if (combined.includes('student') || combined.includes('scholar') || combined.includes('education') || combined.includes('school')) return 'ছাত্র';
  if (combined.includes('health') || combined.includes('medical') || combined.includes('hospital')) return 'স্বাস্থ্য';
  if (combined.includes('old') || combined.includes('senior') || combined.includes('pension') || combined.includes('elderly')) return 'বয়স্ক';
  if (combined.includes('widow')) return 'বিধবা';
  return 'সাধারণ';
}

function getCategoryIcon(cat) {
  const icons = { 'মহিলা': '👩', 'কৃষক': '🌾', 'ছাত্র': '📚', 'স্বাস্থ্য': '🏥', 'বয়স্ক': '👴', 'বিধবা': '🙏', 'সাধারণ': '🏛️' };
  return icons[cat] || '🏛️';
}

function getCategoryColor(cat) {
  const colors = { 'মহিলা': '#FF6B00', 'কৃষক': '#1A5C2A', 'ছাত্র': '#0EA5E9', 'স্বাস্থ্য': '#DC2626', 'বয়স্ক': '#78716C', 'বিধবা': '#9333EA', 'সাধারণ': '#E8A000' };
  return colors[cat] || '#E8A000';
}

// ── Fallback WB Schemes (যদি API কাজ না করে) ────────────

function getWBSchemes() {
  return [
    { id: 1, name: 'লক্ষ্মীর ভাণ্ডার', nameEn: 'Lakshmir Bhandar', description: 'মহিলাদের মাসিক আর্থিক সহায়তা', amount: '₹১,০০০/মাস', amountNum: 12000, category: 'মহিলা', icon: '👩', color: '#FF6B00', eligibility: ['মহিলা', '২৫-৬০ বছর', 'পশ্চিমবঙ্গ'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['আধার কার্ড', 'রেশন কার্ড', 'ব্যাংক পাসবুক'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '১.৬ কোটি', active: true, source: 'fallback' },
    { id: 2, name: 'কৃষক বন্ধু', nameEn: 'Krishak Bandhu', description: 'কৃষকদের বার্ষিক সহায়তা', amount: '₹১০,০০০/বছর', amountNum: 10000, category: 'কৃষক', icon: '🌾', color: '#1A5C2A', eligibility: ['কৃষক', '১৮+ বছর', 'জমি আছে'], applyLink: 'https://krishakbandhu.net', documents: ['আধার কার্ড', 'জমির দলিল'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '৭২ লক্ষ', active: true, source: 'fallback' },
    { id: 3, name: 'PM কিসান', nameEn: 'PM Kisan', description: 'কেন্দ্রীয় কৃষক সহায়তা', amount: '₹৬,০০০/বছর', amountNum: 6000, category: 'কৃষক', icon: '🚜', color: '#E8A000', eligibility: ['কৃষক', 'ভারত'], applyLink: 'https://pmkisan.gov.in', documents: ['আধার কার্ড', 'জমির দলিল'], deadline: 'সারা বছর', ministry: 'Central Govt', beneficiaries: '১১ কোটি', active: true, source: 'fallback' },
    { id: 4, name: 'বিধবা ভাতা', nameEn: 'Vidhwa Sahayata', description: 'বিধবা মহিলাদের মাসিক পেনশন', amount: '₹১,০০০/মাস', amountNum: 12000, category: 'বিধবা', icon: '🙏', color: '#9333EA', eligibility: ['বিধবা মহিলা', '১৮-৬০ বছর'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['মৃত্যু সার্টিফিকেট', 'আধার কার্ড'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '২৩ লক্ষ', active: true, source: 'fallback' },
    { id: 5, name: 'স্বাস্থ্যসাথী', nameEn: 'Swasthya Sathi', description: 'পরিবারের জন্য বিনামূল্যে চিকিৎসা বিমা', amount: '₹৫ লক্ষ/বছর', amountNum: 500000, category: 'স্বাস্থ্য', icon: '🏥', color: '#DC2626', eligibility: ['পরিবার', 'WB বাসিন্দা'], applyLink: 'https://swasthyasathi.gov.in', documents: ['আধার কার্ড', 'রেশন কার্ড'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '৭.৫ কোটি', active: true, source: 'fallback' },
    { id: 6, name: 'ঐক্যশ্রী স্কলারশিপ', nameEn: 'Aikyashree', description: 'সংখ্যালঘু ছাত্রছাত্রীদের বৃত্তি', amount: '₹৫,০০০-৭০,০০০', amountNum: 70000, category: 'ছাত্র', icon: '📚', color: '#0EA5E9', eligibility: ['সংখ্যালঘু', 'WB', 'আয় < ₹২.৫ লক্ষ'], applyLink: 'https://wbmdfcscholarship.in', documents: ['আধার কার্ড', 'নম্বরপত্র', 'আয় সার্টিফিকেট'], deadline: 'অক্টোবর-নভেম্বর', ministry: 'WB Minority', beneficiaries: '৩ লক্ষ', active: true, source: 'fallback' },
    { id: 7, name: 'বার্ধক্য ভাতা', nameEn: 'Old Age Pension', description: 'বয়স্ক নাগরিকদের মাসিক পেনশন', amount: '₹১,০০০/মাস', amountNum: 12000, category: 'বয়স্ক', icon: '👴', color: '#78716C', eligibility: ['৬০+ বছর', 'BPL'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['আধার কার্ড', 'বয়স প্রমাণ'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '৩০ লক্ষ', active: true, source: 'fallback' },
    { id: 8, name: 'সবুজ সাথী', nameEn: 'Sabuj Sathi', description: 'সরকারি স্কুলের ছাত্রদের বিনামূল্যে সাইকেল', amount: 'বিনামূল্যে সাইকেল', amountNum: 5000, category: 'ছাত্র', icon: '🚲', color: '#16A34A', eligibility: ['নবম-দ্বাদশ', 'WB সরকারি স্কুল'], applyLink: 'https://wbsed.gov.in', documents: ['স্কুল ID', 'আধার কার্ড'], deadline: 'সারা বছর', ministry: 'WB Education', beneficiaries: '১ কোটি', active: true, source: 'fallback' },
    { id: 9, name: 'রূপশ্রী', nameEn: 'Rupashree', description: 'গরিব পরিবারের মেয়েদের বিয়েতে সহায়তা', amount: '₹২৫,০০০', amountNum: 25000, category: 'মহিলা', icon: '💍', color: '#F43F5E', eligibility: ['১৮+ মহিলা', 'পারিবারিক আয় < ₹১.৫ লক্ষ'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['আধার কার্ড', 'আয় সার্টিফিকেট', 'বিয়ের নথি'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '৬ লক্ষ', active: true, source: 'fallback' },
    { id: 10, name: 'যুবশ্রী', nameEn: 'Yuvashree', description: 'বেকার যুবকদের ভাতা ও প্রশিক্ষণ', amount: '₹১,৫০০/মাস', amountNum: 18000, category: 'সাধারণ', icon: '👨', color: '#8B5CF6', eligibility: ['১৮-৪৫ বছর', 'বেকার', 'WB'], applyLink: 'https://employmentbankwb.gov.in', documents: ['আধার কার্ড', 'শিক্ষাগত যোগ্যতা'], deadline: 'সারা বছর', ministry: 'WB Labour', beneficiaries: '১ লক্ষ', active: true, source: 'fallback' },
  ];
}