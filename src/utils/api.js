// utils/api.js - Live scheme data
export async function fetchLiveSchemes() {
  try {
    // WB Govt + Central APIs
    const sources = [
      'https://api.setu.co.in/public/v2/schemes?state=WB',  // API Setu
      'https://myscheme.gov.in/api/schemes?lang=bn',       // myScheme Bengali
      'https://bsk.wb.gov.in/api/v4.0/schemes',           // Bangla Sahayata
      'https://nsp.gov.in/api/scholarships'               // National Scholarship
    ];

    const allSchemes = [];
    for (const url of sources) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          allSchemes.push(...(data.schemes || data.results || []));
        }
      } catch (e) {
        console.log(`API ${url} failed, skipping`);
      }
    }

    // Fallback static WB schemes
    return allSchemes.length > 0 ? allSchemes : fallbackWBSchemes();
  } catch (error) {
    return fallbackWBSchemes();
  }
}

function fallbackWBSchemes() {
  return [
    {
      id: 1,
      name: 'লক্ষ্মীর ভাণ্ডার',
      amount: 1000,
      monthly: true,
      eligibility: 'মহিলা, ২৫-৬০ বছর',
      category: 'women',
      state: 'WB'
    },
    {
      id: 2,
      name: 'কৃষক বন্ধু',
      amount: 10000,
      yearly: true,
      eligibility: 'কৃষক, ২ বিঘা+ জমি',
      category: 'farmer',
      state: 'WB'
    },
    {
      id: 3,
      name: 'স্বাস্থ্য সাথী',
      amount: 500000,
      health: true,
      eligibility: 'সবাই (৫ লক্ষ পর্যন্ত)',
      category: 'health',
      state: 'WB'
    },
    // আরো ১৯৭টি...
  ];
}