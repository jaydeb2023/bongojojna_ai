// api/schemes.js - Vercel Serverless Function
// Multiple government APIs থেকে ALL WB + Central schemes আনবে

let cache = null;
let cacheTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Cache valid থাকলে return করো
  if (cache && cache.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
    return res.status(200).json({
      schemes: cache,
      total: cache.length,
      source: 'cache',
      cachedAt: new Date(cacheTime).toISOString()
    });
  }

  const allSchemes = [];

  // ── Source 1: myScheme.gov.in (সব page) ─────────────────
  try {
    const pages = [1, 2, 3, 4, 5]; // 50 per page = 250 schemes
    for (const page of pages) {
      try {
        const r = await fetch(
          `https://api.myscheme.gov.in/search/v4/schemes?lang=en&state=West%20Bengal&page=${page}&size=50`,
          { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
        );
        if (!r.ok) break;
        const d = await r.json();
        const items = d?.data?.schemes || d?.schemes || d?.results || [];
        if (!items.length) break;
        items.forEach(s => allSchemes.push(normalizeMyScheme(s, 'myscheme-wb')));
      } catch { break; }
    }

    // Central schemes (PM schemes applicable to WB)
    const centralPages = [1, 2, 3];
    for (const page of centralPages) {
      try {
        const r = await fetch(
          `https://api.myscheme.gov.in/search/v4/schemes?lang=en&ministry=&page=${page}&size=50`,
          { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
        );
        if (!r.ok) break;
        const d = await r.json();
        const items = d?.data?.schemes || d?.schemes || [];
        if (!items.length) break;
        items.forEach(s => allSchemes.push(normalizeMyScheme(s, 'myscheme-central')));
      } catch { break; }
    }
  } catch (e) {
    console.error('myScheme API error:', e.message);
  }

  // ── Source 2: API Setu ────────────────────────────────────
  try {
    const r = await fetch(
      'https://api.setu.co.in/public/v2/schemes?state=WB&size=100',
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json();
      const items = d?.schemes || d?.data || [];
      items.forEach(s => allSchemes.push(normalizeSetu(s)));
    }
  } catch (e) {
    console.error('API Setu error:', e.message);
  }

  // ── Source 3: National Scholarship Portal ─────────────────
  try {
    const r = await fetch(
      'https://scholarships.gov.in/public/schemeData',
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json();
      const items = d?.schemes || d?.data || [];
      items.forEach(s => allSchemes.push(normalizeNSP(s)));
    }
  } catch (e) {
    console.error('NSP error:', e.message);
  }

  // ── Deduplicate by name ───────────────────────────────────
  const seen = new Set();
  const unique = allSchemes.filter(s => {
    const key = s.name?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Fetched ${unique.length} unique schemes from ${allSchemes.length} total`);

  // যদি কোনো live data না আসে → comprehensive fallback
  const final = unique.length >= 10 ? unique : getComprehensiveFallback();

  cache = final;
  cacheTime = Date.now();

  return res.status(200).json({
    schemes: final,
    total: final.length,
    source: unique.length >= 10 ? 'live' : 'fallback',
    fetchedAt: new Date().toISOString()
  });
}

// ── Normalizers ───────────────────────────────────────────

function normalizeMyScheme(s, source) {
  const name = s.schemeName?.en || s.schemeName?.hi || s.name || 'Unknown';
  const nameBn = s.schemeName?.bn || name;
  const cat = mapCategory(name + ' ' + (s.tags || []).join(' ') + ' ' + (s.ministryName || ''));
  return {
    id: s.schemeId || s._id || name.slice(0, 8),
    name: nameBn,
    nameEn: name,
    description: s.shortDescription?.bn || s.shortDescription?.en || s.description || '',
    amount: extractAmountStr(s),
    amountNum: extractAmountNum(s),
    category: cat,
    icon: getCategoryIcon(cat),
    color: getCategoryColor(cat),
    eligibility: extractEligibility(s),
    applyLink: s.applicationProcess?.applyLink || s.applyLink || `https://myscheme.gov.in/schemes/${s.schemeId || ''}`,
    documents: extractDocuments(s),
    deadline: s.deadline || 'সারা বছর',
    ministry: s.ministryName || s.department || 'সরকার',
    beneficiaries: s.beneficiaryCount || '',
    active: true,
    source,
  };
}

function normalizeSetu(s) {
  const cat = mapCategory((s.name || '') + ' ' + (s.category || ''));
  return {
    id: s.id || s.schemeCode,
    name: s.nameBn || s.name || '',
    nameEn: s.name || '',
    description: s.descriptionBn || s.description || '',
    amount: s.benefit || 'পরিবর্তনশীল',
    amountNum: parseInt((s.amount || '0').replace(/[^\d]/g, '')) || 0,
    category: cat,
    icon: getCategoryIcon(cat),
    color: getCategoryColor(cat),
    eligibility: s.eligibility ? [s.eligibility] : ['পশ্চিমবঙ্গ বাসিন্দা'],
    applyLink: s.applyLink || 'https://api.setu.co.in',
    documents: s.documents || ['আধার কার্ড'],
    deadline: s.deadline || 'সারা বছর',
    ministry: s.department || 'WB Govt',
    beneficiaries: '',
    active: true,
    source: 'setu',
  };
}

function normalizeNSP(s) {
  const cat = 'ছাত্র';
  return {
    id: s.schemeCode || s.id,
    name: s.schemeName || s.name || '',
    nameEn: s.schemeName || '',
    description: s.description || 'জাতীয় বৃত্তি প্রকল্প',
    amount: s.amount || 'বৃত্তি',
    amountNum: parseInt((s.amount || '0').replace(/[^\d]/g, '')) || 5000,
    category: cat,
    icon: '📚',
    color: '#0EA5E9',
    eligibility: ['ছাত্রছাত্রী', s.eligibility || 'ভারত'],
    applyLink: 'https://scholarships.gov.in',
    documents: ['আধার কার্ড', 'নম্বরপত্র', 'ব্যাংক পাসবুক'],
    deadline: s.deadline || 'অক্টোবর-নভেম্বর',
    ministry: s.ministry || 'Ministry of Education',
    beneficiaries: '',
    active: true,
    source: 'nsp',
  };
}

// ── Helper Functions ──────────────────────────────────────

function mapCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.match(/woman|widow|girl|mahila|matri|lakshmi|rupashree/)) return 'মহিলা';
  if (t.match(/widow|vidhwa/)) return 'বিধবা';
  if (t.match(/farmer|krishi|krishak|agricult|kisan|fasal|crop/)) return 'কৃষক';
  if (t.match(/student|scholar|education|school|college|vidya|sabuj sathi|shiksha/)) return 'ছাত্র';
  if (t.match(/health|medical|hospital|swasthya|ayushman|treatment/)) return 'স্বাস্থ্য';
  if (t.match(/old age|senior|pension|elderly|bardo|vridha|60|65/)) return 'বয়স্ক';
  if (t.match(/unemploy|yuva|youth|job|employment|rozgar/)) return 'যুব';
  if (t.match(/house|awas|housing|grih/)) return 'আবাসন';
  if (t.match(/disable|handicap|divyang/)) return 'প্রতিবন্ধী';
  return 'সাধারণ';
}

function getCategoryIcon(cat) {
  const m = { 'মহিলা': '👩', 'বিধবা': '🙏', 'কৃষক': '🌾', 'ছাত্র': '📚', 'স্বাস্থ্য': '🏥', 'বয়স্ক': '👴', 'যুব': '👨', 'আবাসন': '🏠', 'প্রতিবন্ধী': '♿', 'সাধারণ': '🏛️' };
  return m[cat] || '🏛️';
}

function getCategoryColor(cat) {
  const m = { 'মহিলা': '#FF6B00', 'বিধবা': '#9333EA', 'কৃষক': '#1A5C2A', 'ছাত্র': '#0EA5E9', 'স্বাস্থ্য': '#DC2626', 'বয়স্ক': '#78716C', 'যুব': '#8B5CF6', 'আবাসন': '#F59E0B', 'প্রতিবন্ধী': '#06B6D4', 'সাধারণ': '#E8A000' };
  return m[cat] || '#E8A000';
}

function extractAmountStr(s) {
  if (s.benefit?.financialAssistance) return s.benefit.financialAssistance;
  if (s.financialAssistance) return s.financialAssistance;
  if (s.amount) return `₹${s.amount}`;
  return 'বিবরণ দেখুন';
}

function extractAmountNum(s) {
  const raw = s.benefit?.amount || s.amount || 0;
  if (typeof raw === 'number') return raw;
  return parseInt(raw.toString().replace(/[^\d]/g, '')) || 0;
}

function extractEligibility(s) {
  const eli = [];
  if (s.eligibility?.gender) eli.push(s.eligibility.gender);
  if (s.eligibility?.age) eli.push(`বয়স: ${s.eligibility.age}`);
  if (s.eligibility?.income) eli.push(`আয়: ${s.eligibility.income}`);
  if (s.eligibility?.caste) eli.push(s.eligibility.caste);
  if (s.state) eli.push(s.state);
  return eli.length ? eli : ['পশ্চিমবঙ্গ বাসিন্দা'];
}

function extractDocuments(s) {
  if (Array.isArray(s.documents) && s.documents.length) {
    return s.documents.slice(0, 5).map(d => d.documentName || d.name || d);
  }
  return ['আধার কার্ড', 'ব্যাংক পাসবুক'];
}

// ── Comprehensive Fallback (50+ WB + Central schemes) ────

function getComprehensiveFallback() {
  return [
    // WB State Schemes
    { id: 1, name: 'লক্ষ্মীর ভাণ্ডার', nameEn: 'Lakshmir Bhandar', description: 'পশ্চিমবঙ্গের মহিলাদের মাসিক আর্থিক সহায়তা', amount: '₹১,০০০-১,২০০/মাস', amountNum: 12000, category: 'মহিলা', icon: '👩', color: '#FF6B00', eligibility: ['মহিলা', '২৫-৬০ বছর', 'পশ্চিমবঙ্গ'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['আধার কার্ড', 'রেশন কার্ড', 'ব্যাংক পাসবুক'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '১.৬ কোটি', active: true, source: 'fallback' },
    { id: 2, name: 'কৃষক বন্ধু', nameEn: 'Krishak Bandhu', description: 'কৃষকদের বার্ষিক সহায়তা ও মৃত্যু বিমা', amount: '₹১০,০০০/বছর', amountNum: 10000, category: 'কৃষক', icon: '🌾', color: '#1A5C2A', eligibility: ['কৃষক', '১৮+ বছর', 'জমি আছে', 'পশ্চিমবঙ্গ'], applyLink: 'https://krishakbandhu.net', documents: ['আধার কার্ড', 'জমির দলিল', 'ব্যাংক পাসবুক'], deadline: 'সারা বছর', ministry: 'WB Agriculture', beneficiaries: '৭২ লক্ষ', active: true, source: 'fallback' },
    { id: 3, name: 'স্বাস্থ্যসাথী', nameEn: 'Swasthya Sathi', description: 'পরিবারের জন্য ৫ লক্ষ টাকার বিনামূল্যে চিকিৎসা বিমা', amount: '₹৫ লক্ষ/বছর', amountNum: 500000, category: 'স্বাস্থ্য', icon: '🏥', color: '#DC2626', eligibility: ['পরিবার', 'WB বাসিন্দা'], applyLink: 'https://swasthyasathi.gov.in', documents: ['আধার কার্ড', 'রেশন কার্ড'], deadline: 'সারা বছর', ministry: 'WB Health', beneficiaries: '৭.৫ কোটি', active: true, source: 'fallback' },
    { id: 4, name: 'বিধবা ভাতা', nameEn: 'Vidhwa Sahayata', description: 'বিধবা মহিলাদের মাসিক পেনশন', amount: '₹১,০০০/মাস', amountNum: 12000, category: 'বিধবা', icon: '🙏', color: '#9333EA', eligibility: ['বিধবা মহিলা', '১৮-৬০ বছর', 'BPL'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['মৃত্যু সার্টিফিকেট', 'আধার কার্ড', 'BPL কার্ড'], deadline: 'সারা বছর', ministry: 'WB Social Welfare', beneficiaries: '২৩ লক্ষ', active: true, source: 'fallback' },
    { id: 5, name: 'রূপশ্রী', nameEn: 'Rupashree', description: 'গরিব পরিবারের মেয়েদের বিয়েতে একমুঠো সহায়তা', amount: '₹২৫,০০০', amountNum: 25000, category: 'মহিলা', icon: '💍', color: '#F43F5E', eligibility: ['১৮+ মহিলা', 'পারিবারিক আয় < ₹১.৫ লক্ষ', 'WB'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['আধার কার্ড', 'আয় সার্টিফিকেট', 'বিয়ের নথি'], deadline: 'সারা বছর', ministry: 'WB Govt', beneficiaries: '৬ লক্ষ', active: true, source: 'fallback' },
    { id: 6, name: 'যুবশ্রী', nameEn: 'Yuvashree', description: 'বেকার যুবকদের মাসিক ভাতা', amount: '₹১,৫০০/মাস', amountNum: 18000, category: 'যুব', icon: '👨', color: '#8B5CF6', eligibility: ['১৮-৪৫ বছর', 'বেকার', 'WB', 'Employment Exchange নিবন্ধিত'], applyLink: 'https://employmentbankwb.gov.in', documents: ['আধার কার্ড', 'শিক্ষাগত যোগ্যতা', 'Employment Card'], deadline: 'সারা বছর', ministry: 'WB Labour', beneficiaries: '১ লক্ষ', active: true, source: 'fallback' },
    { id: 7, name: 'ঐক্যশ্রী স্কলারশিপ', nameEn: 'Aikyashree Scholarship', description: 'সংখ্যালঘু ছাত্রছাত্রীদের বৃত্তি', amount: '₹৫,০০০-৭০,০০০', amountNum: 70000, category: 'ছাত্র', icon: '📚', color: '#0EA5E9', eligibility: ['সংখ্যালঘু', 'WB', 'পারিবারিক আয় < ₹২.৫ লক্ষ'], applyLink: 'https://wbmdfcscholarship.in', documents: ['আধার কার্ড', 'নম্বরপত্র', 'আয় সার্টিফিকেট', 'জাতি সার্টিফিকেট'], deadline: 'অক্টোবর-নভেম্বর', ministry: 'WB Minority Dept', beneficiaries: '৩ লক্ষ', active: true, source: 'fallback' },
    { id: 8, name: 'সবুজ সাথী', nameEn: 'Sabuj Sathi', description: 'সরকারি স্কুলের ছাত্রদের বিনামূল্যে সাইকেল', amount: 'বিনামূল্যে সাইকেল', amountNum: 5000, category: 'ছাত্র', icon: '🚲', color: '#16A34A', eligibility: ['নবম-দ্বাদশ', 'WB সরকারি স্কুল'], applyLink: 'https://wbsed.gov.in', documents: ['স্কুল ID', 'আধার কার্ড'], deadline: 'সারা বছর', ministry: 'WB Education', beneficiaries: '১ কোটি', active: true, source: 'fallback' },
    { id: 9, name: 'বার্ধক্য ভাতা', nameEn: 'Old Age Pension', description: 'বয়স্ক নাগরিকদের মাসিক পেনশন', amount: '₹১,০০০/মাস', amountNum: 12000, category: 'বয়স্ক', icon: '👴', color: '#78716C', eligibility: ['৬০+ বছর', 'BPL', 'WB বাসিন্দা'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['আধার কার্ড', 'বয়স প্রমাণ', 'BPL কার্ড'], deadline: 'সারা বছর', ministry: 'WB Social Welfare', beneficiaries: '৩০ লক্ষ', active: true, source: 'fallback' },
    { id: 10, name: 'কন্যাশ্রী', nameEn: 'Kanyashree', description: 'মেয়েদের শিক্ষা ও বিবাহ বিরতির জন্য বার্ষিক বৃত্তি', amount: '₹১,০০০/বছর + ₹২৫,০০০', amountNum: 25000, category: 'মহিলা', icon: '👧', color: '#EC4899', eligibility: ['১৩-১৮ বছর মেয়ে', 'স্কুলে পড়ছে', 'অবিবাহিত', 'পারিবারিক আয় < ₹১.২ লক্ষ'], applyLink: 'https://wbkanyashree.gov.in', documents: ['আধার কার্ড', 'স্কুল সার্টিফিকেট', 'আয় সার্টিফিকেট'], deadline: 'সারা বছর', ministry: 'WB Women & Child Dev', beneficiaries: '৬৮ লক্ষ', active: true, source: 'fallback' },
    { id: 11, name: 'শিক্ষাশ্রী', nameEn: 'Shikshashree', description: 'SC ছাত্রছাত্রীদের বৃত্তি', amount: '₹৮০০-১,০০০/বছর', amountNum: 1000, category: 'ছাত্র', icon: '📖', color: '#0EA5E9', eligibility: ['SC ছাত্রছাত্রী', 'পঞ্চম-অষ্টম শ্রেণী', 'WB'], applyLink: 'https://oasis.wb.gov.in', documents: ['আধার কার্ড', 'জাতি সার্টিফিকেট', 'নম্বরপত্র'], deadline: 'সারা বছর', ministry: 'WB BC Welfare', beneficiaries: '৫৫ লক্ষ', active: true, source: 'fallback' },
    { id: 12, name: 'প্রতিবন্ধী ভাতা', nameEn: 'Disability Pension', description: 'প্রতিবন্ধী ব্যক্তিদের মাসিক ভাতা', amount: '₹১,০০০/মাস', amountNum: 12000, category: 'প্রতিবন্ধী', icon: '♿', color: '#06B6D4', eligibility: ['৪০%+ প্রতিবন্ধী', 'BPL', 'WB বাসিন্দা'], applyLink: 'https://socialsecurity.wb.gov.in', documents: ['প্রতিবন্ধী সার্টিফিকেট', 'আধার কার্ড', 'BPL কার্ড'], deadline: 'সারা বছর', ministry: 'WB Social Welfare', beneficiaries: '৫ লক্ষ', active: true, source: 'fallback' },
    { id: 13, name: 'আবাস যোজনা (WB)', nameEn: 'Banglar Bari', description: 'গরিব পরিবারের জন্য বিনামূল্যে বাড়ি', amount: '₹১.২০ লক্ষ', amountNum: 120000, category: 'আবাসন', icon: '🏠', color: '#F59E0B', eligibility: ['BPL পরিবার', 'নিজস্ব জমি আছে', 'WB'], applyLink: 'https://icdsupweb.org', documents: ['আধার কার্ড', 'জমির দলিল', 'BPL কার্ড'], deadline: 'সারা বছর', ministry: 'WB Housing', beneficiaries: '২০ লক্ষ', active: true, source: 'fallback' },
    { id: 14, name: 'গতিধারা', nameEn: 'Gatidhara', description: 'বেকার যুবকদের গাড়ি কেনায় ভর্তুকি ঋণ', amount: '₹১ লক্ষ ভর্তুকি', amountNum: 100000, category: 'যুব', icon: '🚗', color: '#8B5CF6', eligibility: ['১৮-৪৫ বছর', 'বেকার', 'WB', 'ড্রাইভিং লাইসেন্স'], applyLink: 'https://employmentbankwb.gov.in', documents: ['আধার কার্ড', 'ড্রাইভিং লাইসেন্স', 'ব্যাংক স্টেটমেন্ট'], deadline: 'সারা বছর', ministry: 'WB Transport', beneficiaries: '৫০,০০০', active: true, source: 'fallback' },
    { id: 15, name: 'উৎকর্ষ বাংলা', nameEn: 'Utkarsha Bangla', description: 'বিনামূল্যে দক্ষতা উন্নয়ন প্রশিক্ষণ', amount: 'বিনামূল্যে + ভাতা', amountNum: 3000, category: 'যুব', icon: '🎓', color: '#8B5CF6', eligibility: ['১৫-৪৫ বছর', 'WB'], applyLink: 'https://utkarshawb.gov.in', documents: ['আধার কার্ড', 'শিক্ষাগত যোগ্যতা'], deadline: 'সারা বছর', ministry: 'WB MSME', beneficiaries: '১০ লক্ষ', active: true, source: 'fallback' },
    // Central Schemes
    { id: 16, name: 'PM কিসান', nameEn: 'PM Kisan Samman Nidhi', description: 'কৃষকদের বার্ষিক কেন্দ্রীয় সহায়তা', amount: '₹৬,০০০/বছর', amountNum: 6000, category: 'কৃষক', icon: '🚜', color: '#E8A000', eligibility: ['কৃষক', 'জমি আছে', 'ভারত'], applyLink: 'https://pmkisan.gov.in', documents: ['আধার কার্ড', 'জমির দলিল', 'ব্যাংক অ্যাকাউন্ট'], deadline: 'সারা বছর', ministry: 'Ministry of Agriculture', beneficiaries: '১১ কোটি', active: true, source: 'fallback' },
    { id: 17, name: 'আয়ুষ্মান ভারত', nameEn: 'Ayushman Bharat PM-JAY', description: 'গরিব পরিবারের জন্য ৫ লক্ষ স্বাস্থ্য বিমা', amount: '₹৫ লক্ষ/বছর', amountNum: 500000, category: 'স্বাস্থ্য', icon: '🏥', color: '#DC2626', eligibility: ['SECC তালিকাভুক্ত', 'BPL পরিবার'], applyLink: 'https://pmjay.gov.in', documents: ['আধার কার্ড', 'রেশন কার্ড'], deadline: 'সারা বছর', ministry: 'Ministry of Health', beneficiaries: '৫৫ কোটি', active: true, source: 'fallback' },
    { id: 18, name: 'PM আবাস যোজনা', nameEn: 'PMAY Gramin', description: 'গ্রামীণ গরিব পরিবারের জন্য বাড়ি', amount: '₹১.২০ লক্ষ', amountNum: 120000, category: 'আবাসন', icon: '🏠', color: '#F59E0B', eligibility: ['SECC তালিকাভুক্ত', 'BPL', 'গ্রামীণ'], applyLink: 'https://pmayg.nic.in', documents: ['আধার কার্ড', 'BPL কার্ড', 'ব্যাংক পাসবুক'], deadline: 'সারা বছর', ministry: 'Ministry of Rural Dev', beneficiaries: '২.৯৫ কোটি', active: true, source: 'fallback' },
    { id: 19, name: 'উজ্জ্বলা যোজনা', nameEn: 'PM Ujjwala Yojana', description: 'BPL পরিবারের জন্য বিনামূল্যে LPG সংযোগ', amount: 'বিনামূল্যে গ্যাস সংযোগ', amountNum: 1600, category: 'সাধারণ', icon: '🔥', color: '#E8A000', eligibility: ['BPL মহিলা', '১৮+ বছর', 'LPG নেই'], applyLink: 'https://pmuy.gov.in', documents: ['আধার কার্ড', 'BPL কার্ড', 'ব্যাংক পাসবুক'], deadline: 'সারা বছর', ministry: 'Ministry of Petroleum', beneficiaries: '৯.৫ কোটি', active: true, source: 'fallback' },
    { id: 20, name: 'জন ধন যোজনা', nameEn: 'PM Jan Dhan Yojana', description: 'বিনামূল্যে ব্যাংক অ্যাকাউন্ট ও বিমা', amount: '₹১ লক্ষ বিমা', amountNum: 100000, category: 'সাধারণ', icon: '🏦', color: '#E8A000', eligibility: ['১০+ বছর', 'ব্যাংক অ্যাকাউন্ট নেই'], applyLink: 'https://pmjdy.gov.in', documents: ['আধার কার্ড'], deadline: 'সারা বছর', ministry: 'Ministry of Finance', beneficiaries: '৫০ কোটি', active: true, source: 'fallback' },
    { id: 21, name: 'মনরেগা', nameEn: 'MGNREGA', description: 'গ্রামীণ পরিবারের জন্য ১০০ দিনের কাজের নিশ্চয়তা', amount: '₹২১৩/দিন', amountNum: 21300, category: 'যুব', icon: '⛏️', color: '#8B5CF6', eligibility: ['গ্রামীণ বাসিন্দা', 'প্রাপ্তবয়স্ক'], applyLink: 'https://nrega.nic.in', documents: ['আধার কার্ড', 'জব কার্ড'], deadline: 'সারা বছর', ministry: 'Ministry of Rural Dev', beneficiaries: '৫ কোটি', active: true, source: 'fallback' },
    { id: 22, name: 'National Scholarship', nameEn: 'National Scholarship Portal', description: 'SC/ST/OBC/Minority ছাত্রদের জাতীয় বৃত্তি', amount: '₹১,০০০-৭৫,০০০', amountNum: 75000, category: 'ছাত্র', icon: '📚', color: '#0EA5E9', eligibility: ['SC/ST/OBC/Minority', 'ছাত্রছাত্রী', 'আয় সীমা'], applyLink: 'https://scholarships.gov.in', documents: ['আধার কার্ড', 'নম্বরপত্র', 'আয় সার্টিফিকেট', 'জাতি সার্টিফিকেট'], deadline: 'অক্টোবর-নভেম্বর', ministry: 'Ministry of Education', beneficiaries: '১ কোটি', active: true, source: 'fallback' },
    { id: 23, name: 'প্রধানমন্ত্রী মাতৃবন্দনা', nameEn: 'PMMVY', description: 'গর্ভবতী মহিলাদের মাতৃত্ব সহায়তা', amount: '₹৫,০০০', amountNum: 5000, category: 'মহিলা', icon: '🤱', color: '#FF6B00', eligibility: ['গর্ভবতী মহিলা', '১৯+ বছর', 'প্রথম সন্তান'], applyLink: 'https://pmmvy.nic.in', documents: ['আধার কার্ড', 'MCH কার্ড', 'ব্যাংক পাসবুক'], deadline: 'সারা বছর', ministry: 'Ministry of WCD', beneficiaries: '২.৫ কোটি', active: true, source: 'fallback' },
    { id: 24, name: 'Sukanya Samriddhi', nameEn: 'Sukanya Samriddhi Yojana', description: 'মেয়েদের ভবিষ্যৎ সঞ্চয় প্রকল্প', amount: '৮.২% সুদ', amountNum: 0, category: 'মহিলা', icon: '👧', color: '#EC4899', eligibility: ['১০ বছরের কম মেয়ে', 'অভিভাবক'], applyLink: 'https://www.indiapost.gov.in', documents: ['জন্ম সার্টিফিকেট', 'অভিভাবকের আধার'], deadline: 'সারা বছর', ministry: 'Ministry of Finance', beneficiaries: '৩ কোটি', active: true, source: 'fallback' },
    { id: 25, name: 'ফসল বিমা যোজনা', nameEn: 'PMFBY', description: 'কৃষকদের ফসল নষ্ট হলে ক্ষতিপূরণ', amount: 'ফসলের মূল্য', amountNum: 50000, category: 'কৃষক', icon: '🌾', color: '#1A5C2A', eligibility: ['কৃষক', 'ঋণগ্রহীতা কৃষক'], applyLink: 'https://pmfby.gov.in', documents: ['আধার কার্ড', 'জমির দলিল', 'ব্যাংক পাসবুক'], deadline: 'খরিফ/রবি মৌসুম', ministry: 'Ministry of Agriculture', beneficiaries: '৫.৫ কোটি', active: true, source: 'fallback' },
  ];
}