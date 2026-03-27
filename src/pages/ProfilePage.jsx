import React, { useState } from 'react';
import { ChevronRight, Save, User, MapPin, Briefcase, Heart } from 'lucide-react';
import { PROFILE_OPTIONS } from '../data/schemes';

const STORAGE_KEY = 'bongojojna_profile';

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(loadProfile);
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setProfile(p => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const completedFields = Object.values(profile).filter(Boolean).length;
  const totalFields = 6;
  const pct = Math.round((completedFields / totalFields) * 100);

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-deepgreen to-green-800 text-white px-4 pt-5 pb-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="font-noto font-bold text-xl">আমার প্রোফাইল</h2>
              <p className="text-green-200 text-sm">{pct}% সম্পূর্ণ</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-saffron rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-green-200 text-xs mt-2">
            প্রোফাইল পূরণ করলে সঠিক স্কিম পাবেন
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="card space-y-5">

          {/* Gender */}
          <Section icon={<User size={16} />} title="লিঙ্গ">
            <OptionGroup
              options={PROFILE_OPTIONS.gender}
              value={profile.gender}
              onChange={v => update('gender', v)}
            />
          </Section>

          {/* Age */}
          <Section icon={<span className="text-sm">🎂</span>} title="বয়স">
            <OptionGroup
              options={PROFILE_OPTIONS.ageGroups}
              value={profile.ageGroup}
              onChange={v => update('ageGroup', v)}
            />
          </Section>

          {/* Occupation */}
          <Section icon={<Briefcase size={16} />} title="পেশা">
            <OptionGroup
              options={PROFILE_OPTIONS.occupation}
              value={profile.occupation}
              onChange={v => update('occupation', v)}
            />
          </Section>

          {/* Marital Status */}
          <Section icon={<Heart size={16} />} title="বৈবাহিক অবস্থা">
            <OptionGroup
              options={PROFILE_OPTIONS.maritalStatus}
              value={profile.maritalStatus}
              onChange={v => update('maritalStatus', v)}
            />
          </Section>

          {/* Income */}
          <Section icon={<span className="text-sm">💰</span>} title="পারিবারিক আয়">
            <OptionGroup
              options={PROFILE_OPTIONS.income}
              value={profile.income}
              onChange={v => update('income', v)}
            />
          </Section>

          {/* District */}
          <Section icon={<MapPin size={16} />} title="জেলা">
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {PROFILE_OPTIONS.district.map(d => (
                <button
                  key={d}
                  onClick={() => update('district', d)}
                  className={`text-sm px-3 py-2 rounded-xl border transition-all text-left
                    ${profile.district === d
                      ? 'bg-saffron text-white border-saffron'
                      : 'bg-orange-50 text-bark border-orange-100 hover:border-saffron'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Section>

          {/* Save button */}
          <button
            onClick={saveProfile}
            className={`btn-primary w-full flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-deepgreen' : ''
            }`}
          >
            <Save size={18} />
            {saved ? '✅ সংরক্ষিত হয়েছে!' : 'প্রোফাইল সংরক্ষণ করুন'}
          </button>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-gray-400 text-center mt-4 px-4">
          🔒 আপনার তথ্য আপনার ফোনেই থাকে। আমরা ব্যক্তিগত তথ্য কাউকে দিই না।
        </p>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-saffron">{icon}</span>
        <p className="text-sm font-semibold text-bark">{title}</p>
      </div>
      {children}
    </div>
  );
}

function OptionGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-sm px-3 py-1.5 rounded-xl border transition-all
            ${value === opt
              ? 'bg-saffron text-white border-saffron'
              : 'bg-orange-50 text-bark border-orange-100 hover:border-saffron'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
