import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import SchemeCard from '../components/SchemeCard';
import { SCHEMES, CATEGORIES } from '../data/schemes';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = SCHEMES.filter(scheme => {
    const matchCat = activeCategory === 'all' || scheme.category === activeCategory;
    const matchQuery = !query || 
      scheme.name.includes(query) || 
      scheme.description.includes(query) ||
      scheme.eligibility.some(e => e.includes(query));
    return matchCat && matchQuery;
  });

  return (
    <div className="pb-24 min-h-screen">
      <div className="bg-deepgreen text-white px-4 pt-5 pb-8">
        <div className="max-w-md mx-auto">
          <h2 className="font-noto font-bold text-xl mb-4">স্কিম খুঁজুন</h2>
          {/* Search input */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="স্কিমের নাম বা ধরন লিখুন..."
              className="w-full bg-white rounded-2xl pl-10 pr-10 py-3 text-bark text-sm focus:outline-none focus:ring-2 focus:ring-saffron shadow"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium transition-all
                ${activeCategory === cat.id
                  ? 'bg-saffron text-white shadow-md'
                  : 'bg-white text-bark border border-orange-100'
                }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 mb-4">
          {filtered.length}টি স্কিম পাওয়া গেছে
        </p>

        {/* Scheme cards */}
        {filtered.length > 0 ? (
          filtered.map(scheme => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">কোনো স্কিম পাওয়া গেলো না</p>
            <button onClick={() => { setQuery(''); setActiveCategory('all'); }} className="mt-3 text-saffron text-sm font-medium">
              সব দেখুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
