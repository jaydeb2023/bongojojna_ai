import React from 'react';
import { Bell, Menu } from 'lucide-react';

export default function Header({ onMenuOpen }) {
  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-orange-100 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-deepgreen rounded-xl flex items-center justify-center shadow">
            <span className="text-white font-noto font-bold text-lg">ব</span>
          </div>
          <div>
            <h1 className="font-noto font-bold text-bark text-lg leading-none">বঙ্গযোজনা</h1>
            <p className="text-xs text-gray-400">সরকারি সুবিধা আপনার হাতে</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 flex items-center justify-center text-bark hover:text-saffron transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-saffron rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
