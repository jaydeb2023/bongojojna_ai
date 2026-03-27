import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceButton({ isListening, onStart, onStop, size = 'lg' }) {
  const isLg = size === 'lg';

  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <div className={`absolute rounded-full bg-saffron/20 voice-ring ${isLg ? 'w-32 h-32' : 'w-20 h-20'}`} />
          <div className={`absolute rounded-full bg-saffron/10 voice-ring-2 ${isLg ? 'w-32 h-32' : 'w-20 h-20'}`} />
        </>
      )}
      <button
        onMouseDown={onStart}
        onMouseUp={onStop}
        onTouchStart={(e) => { e.preventDefault(); onStart(); }}
        onTouchEnd={(e) => { e.preventDefault(); onStop(); }}
        className={`relative z-10 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95
          ${isListening
            ? 'bg-saffron text-white scale-110 shadow-saffron/50'
            : 'bg-deepgreen text-white hover:bg-green-800'
          }
          ${isLg ? 'w-24 h-24' : 'w-14 h-14'}
        `}
      >
        {isListening
          ? <MicOff size={isLg ? 36 : 22} />
          : <Mic size={isLg ? 36 : 22} />
        }
      </button>
    </div>
  );
}

// Waveform animation when listening
export function Waveform({ isActive }) {
  if (!isActive) return null;
  return (
    <div className="flex items-center gap-1 h-8">
      {[1,2,3,4,5,6,7].map(i => (
        <div key={i} className="bar h-2 bg-saffron rounded" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}
