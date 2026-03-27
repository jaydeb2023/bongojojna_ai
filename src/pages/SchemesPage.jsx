import React, { useState, useEffect } from 'react';
import SchemeCard from '../components/SchemeCard';
import { fetchSchemes } from '../utils/matcher';
import { CATEGORIES } from '../data/schemes';

export default function SchemesPage() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [source, setSource] = useState('');

  useEffect(() => {
    fetchSchemes().then(data => {
      setSchemes(data);
      setSource(data[0]?.source || '');
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === 'all'
    ? schemes
    : schemes.filter(s => s.category === activeCategory);

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-gradient-to-br from-bark to-amber-900 text-white px-4 pt-5 pb-8">
        <div className="max-w-md mx-auto">
          <h2 className="font-noto font-bold text-xl">সব স্কিম</h2>
          <p className="text-amber-200 text-sm mt-1">
            {loading ? 'লোড হচ্ছে...' : `${schemes.length}টি স্কিম • ${source === 'live' ? '🟢 Live' : '📦 Cached'}`}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-all
                ${activeCategory === cat.id ? 'bg-saffron text-white shadow-md' : 'bg-white text-bark border border-orange-100'}`}>
              <span>{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-3xl shimmer" />)}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">{filtered.length}টি স্কিম</p>
            {filtered.map(scheme => <SchemeCard key={scheme.id} scheme={scheme} />)}
          </>
        )}
      </div>
    </div>
  );
}