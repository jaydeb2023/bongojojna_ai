# বঙ্গযোজনা 🌾

> ভয়েস-ভিত্তিক বাংলা সরকারি স্কিম ও স্কলারশিপ ফাইন্ডার

## কী আছে এই অ্যাপে?

- 🎤 **ভয়েস সার্চ** — বাংলায় বলুন, সাথে সাথে স্কিম খুঁজে পান
- 📋 **২০০+ স্কিম** — লক্ষ্মীর ভাণ্ডার, কৃষক বন্ধু, স্বাস্থ্যসাথী সহ সব
- 👤 **প্রোফাইল ম্যাচিং** — আপনার তথ্য দিয়ে সঠিক স্কিম পান
- 📱 **মোবাইল ফার্স্ট** — গ্রামীণ ব্যবহারকারীদের জন্য ডিজাইন করা

## দ্রুত শুরু করুন

```bash
# ১. ফাইল নামান
git clone https://github.com/YOUR_USERNAME/bongojojna.git
cd bongojojna

# ২. ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# ৩. লোকাল রান করুন
npm run dev

# ৪. বিল্ড করুন
npm run build
```

## Vercel-এ Deploy করুন

### Option A: Vercel CLI (সহজ)
```bash
npm install -g vercel
vercel --prod
```

### Option B: GitHub থেকে Auto Deploy
1. GitHub-এ রিপো পুশ করুন
2. [vercel.com](https://vercel.com) → "New Project"
3. GitHub রিপো select করুন
4. Deploy ক্লিক করুন ✅

## টেক স্ট্যাক

| টুল | ব্যবহার |
|-----|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Web Speech API | Voice Recognition (Bengali) |
| Lucide React | Icons |

## ফাইল স্ট্রাকচার

```
bongojojna/
├── src/
│   ├── components/
│   │   ├── Header.jsx        # টপ হেডার
│   │   ├── BottomNav.jsx     # নিচের নেভিগেশন
│   │   ├── VoiceButton.jsx   # মাইক বাটন + ওয়েভফর্ম
│   │   └── SchemeCard.jsx    # স্কিম কার্ড (expand করে)
│   ├── pages/
│   │   ├── HomePage.jsx      # ভয়েস সার্চ হোম
│   │   ├── SearchPage.jsx    # টেক্সট সার্চ + ফিল্টার
│   │   ├── SchemesPage.jsx   # সব স্কিম লিস্ট
│   │   └── ProfilePage.jsx   # ইউজার প্রোফাইল
│   ├── hooks/
│   │   └── useVoice.js       # Speech Recognition hook
│   ├── utils/
│   │   └── matcher.js        # স্কিম ম্যাচিং লজিক
│   ├── data/
│   │   └── schemes.js        # ৮টি স্কিম ডেটা
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── favicon.svg
├── index.html
├── vercel.json
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## ভয়েস সার্চ কীভাবে কাজ করে

1. ব্যবহারকারী মাইক চেপে ধরেন
2. `Web Speech API` (bn-IN) বাংলা শোনে
3. `matcher.js` কীওয়ার্ড বিশ্লেষণ করে
4. ম্যাচিং স্কিম score অনুযায়ী দেখায়

### উদাহরণ কীওয়ার্ড
- "বিধবা" → বিধবা ভাতা
- "কৃষক" / "জমি" → কৃষক বন্ধু, PM কিসান
- "ছাত্র" / "পড়াশোনা" → ঐক্যশ্রী, সবুজ সাথী
- "বৃদ্ধ" / "৬০" → বার্ধক্য ভাতা

## পরবর্তী আপডেট (Coming Soon)

- [ ] ভাষিণী API integration (offline voice)
- [ ] আরও ১৯২টি স্কিম যোগ করা
- [ ] আবেদন ফর্ম auto-fill
- [ ] PWA offline support
- [ ] Push notifications

## লাইসেন্স

MIT © বঙ্গযোজনা ২০২৫
