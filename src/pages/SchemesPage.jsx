import React from 'react';
import SchemeCard from '../components/SchemeCard';
import { SCHEMES } from '../data/schemes';

const FEATURED = [
  { title: '🔥 সর্বাধিক আবেদন', ids: [1, 2, 5] },
  { title: '💰 সর্বোচ্চ টাকা', ids: [5, 6, 3] },
  { title: '📚 ছাত্রছাত্রী', ids: [6, 8] },
];

export default function SchemesPage() {
  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-bark to-amber-900 text-white px-4 pt-5 pb-8">
        <div className="max-w-md mx-auto">
          <h2 className="font-noto font-bold text-xl">সব স্কিম</h2>
          <p className="text-amber-200 text-sm mt-1">২০০+ সরকারি সুবিধা এক জায়গায়</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-5">
        {FEATURED.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="font-noto font-bold text-bark text-base mb-3">{section.title}</h3>
            {section.ids.map(id => {
              const scheme = SCHEMES.find(s => s.id === id);
              return scheme ? <SchemeCard key={id} scheme={scheme} /> : null;
            })}
          </div>
        ))}

        <div className="mb-6">
          <h3 className="font-noto font-bold text-bark text-base mb-3">📋 সব স্কিম</h3>
          {SCHEMES.map(scheme => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      </div>
    </div>
  );
}
