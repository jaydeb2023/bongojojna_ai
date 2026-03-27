import React from 'react';
import { Home, Search, BookOpen, User } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'হোম', icon: Home },
  { id: 'search', label: 'খুঁজুন', icon: Search },
  { id: 'schemes', label: 'স্কিম', icon: BookOpen },
  { id: 'profile', label: 'প্রোফাইল', icon: User },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-100 shadow-lg">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-all duration-200 ${
              active === id ? 'nav-active' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={22} strokeWidth={active === id ? 2.5 : 1.8} />
            <span className="text-xs font-hind">{label}</span>
            {active === id && (
              <span className="w-1 h-1 bg-saffron rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
