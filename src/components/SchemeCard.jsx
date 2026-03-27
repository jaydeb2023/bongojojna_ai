import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, FileText, Clock, Users } from 'lucide-react';

export default function SchemeCard({ scheme, highlight = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`scheme-card card mb-3 cursor-pointer
        ${highlight ? 'ring-2 ring-saffron ring-offset-1' : ''}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
          style={{ backgroundColor: scheme.color + '20' }}
        >
          {scheme.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-noto font-bold text-bark text-base leading-tight">{scheme.name}</h3>
            <span className="scheme-tag flex-shrink-0 text-xs">{scheme.category}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{scheme.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="amount-badge text-sm">{scheme.amount}</span>
            <span className="text-xs text-gray-400">প্রতি বছর</span>
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-orange-100 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-orange-50 rounded-xl p-2 text-center">
              <Users size={14} className="mx-auto text-saffron mb-1" />
              <p className="text-xs text-gray-500">সুবিধাভোগী</p>
              <p className="text-xs font-bold text-bark">{scheme.beneficiaries}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-2 text-center">
              <Clock size={14} className="mx-auto text-deepgreen mb-1" />
              <p className="text-xs text-gray-500">আবেদনের সময়</p>
              <p className="text-xs font-bold text-bark">{scheme.deadline}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-2 text-center">
              <FileText size={14} className="mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-gray-500">বিভাগ</p>
              <p className="text-xs font-bold text-bark">{scheme.ministry}</p>
            </div>
          </div>

          {/* Eligibility */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">✅ যোগ্যতা:</p>
            <div className="flex flex-wrap gap-1">
              {scheme.eligibility.map((e, i) => (
                <span key={i} className="bg-green-50 text-deepgreen text-xs px-2 py-0.5 rounded-full border border-green-200">
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">📄 দরকারি কাগজপত্র:</p>
            <div className="flex flex-wrap gap-1">
              {scheme.documents.map((d, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <a
            href={scheme.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 btn-primary w-full text-sm"
          >
            <ExternalLink size={16} />
            এখনই আবেদন করুন
          </a>
        </div>
      )}
    </div>
  );
}
