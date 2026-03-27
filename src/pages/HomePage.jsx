import React, { useState, useEffect } from 'react';
import VoiceButton, { Waveform } from '../components/VoiceButton';
import SchemeCard from '../components/SchemeCard';
import { useVoice } from '../hooks/useVoice';
import { matchSchemesAI, calcTotalBenefits } from '../utils/matcher';
import { SCHEMES } from '../data/schemes';

const DEMO_QUERIES = [
  '"আমি বিধবা মহিলা, বয়স ৪৫, মালদায় থাকি"',
  '"আমি কৃষক, ২ বিঘা জমি আছে, বর্ধমান"',
  '"আমার মেয়ে কলেজে পড়ে, পরিবার গরিব"',
  '"৬৫ বছর বয়স্ক, একা থাকি, বিপিএল কার্ড আছে"',
];

export default function HomePage() {
  const { isListening, transcript, interimTranscript, error, startListening, stopListening, resetTranscript } = useVoice();
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [demoText, setDemoText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const [aiUnderstood, setAiUnderstood] = useState(null);

  // When transcript is ready, match schemes
  useEffect(() => {
    if (transcript && !isListening) {
      processSearch(transcript);
    }
  }, [transcript, isListening]);

  async function processSearch(text) {
    setIsProcessing(true);
    try {
      const apiKey = import.meta.env.VITE_OPENAI_KEY;
      const { schemes, understood, message } = await matchSchemesAI(text, apiKey);
      
      // Always include Swasthya Sathi if relevant
      const hasHealth = schemes.find(s => s.id === 5);
      if (!hasHealth) {
        const healthScheme = SCHEMES.find(s => s.id === 5);
        if (healthScheme) schemes.push({ ...healthScheme, score: 1 });
      }
      
      setResults(schemes.slice(0, 5));
      setAiMessage(message);
      setAiUnderstood(understood);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setAiMessage('কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
    }
  }

  function tryDemo(query) {
    resetTranscript();
    setDemoText(query.replace(/"/g, ''));
    processSearch(query);
  }

  function handleReset() {
    resetTranscript();
    setResults([]);
    setHasSearched(false);
    setDemoText('');
    setAiMessage(null);
    setAiUnderstood(null);
  }

  const totalBenefit = calcTotalBenefits(results);

  return (
    <div className="pb-24 min-h-screen">
      {/* Hero section */}
      {!hasSearched && (
        <div className="bg-gradient-to-br from-deepgreen to-green-700 text-white px-4 pt-6 pb-10">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-block bg-white/10 text-white text-xs px-3 py-1 rounded-full mb-3 font-hind">
              🆓 সম্পূর্ণ বিনামূল্যে
            </div>
            <h2 className="font-noto text-2xl font-bold mb-2 leading-tight">
              আপনার জন্য কোন স্কিম?
            </h2>
            <p className="text-green-200 text-sm mb-6">
              মাইক চেপে বলুন আপনার কথা — বাংলায়
            </p>

            {/* Voice Button */}
            <div className="flex flex-col items-center gap-4">
              <VoiceButton
                isListening={isListening}
                onStart={startListening}
                onStop={stopListening}
              />
              <Waveform isActive={isListening} />
              {isListening ? (
                <div className="text-center">
                  <p className="text-white text-sm font-semibold animate-pulse">🎤 শুনছি... বলতে থাকুন</p>
                  <p className="text-green-200 text-xs mt-1">থামলে অটো বন্ধ হবে</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-green-200 text-sm">মাইক চেপে বলুন</p>
                  <p className="text-green-300/60 text-xs mt-1">যত খুশি বলুন, থামলে বন্ধ হবে</p>
                </div>
              )}
            </div>

            {/* Live interim transcript while speaking */}
            {isListening && interimTranscript && (
              <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 text-left border border-white/20">
                <p className="text-xs text-green-200 mb-1">🎤 শুনছি...</p>
                <p className="text-white/80 text-sm italic">"{interimTranscript}"</p>
              </div>
            )}

            {/* Final transcript display */}
            {!isListening && (transcript || demoText) && (
              <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 text-left">
                <p className="text-xs text-green-200 mb-1">আপনি বললেন:</p>
                <p className="text-white text-sm font-medium">"{transcript || demoText}"</p>
              </div>
            )}

            {error && (
              <div className="mt-3 bg-red-500/20 rounded-xl px-4 py-2">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4">
        {/* Demo queries */}
        {!hasSearched && (
          <div className="mt-6">
            <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wide">উদাহরণ বলুন:</p>
            <div className="space-y-2">
              {DEMO_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => tryDemo(q)}
                  className="w-full text-left bg-white rounded-2xl px-4 py-3 text-sm text-bark shadow-sm border border-orange-100 hover:border-saffron hover:shadow-md transition-all duration-200 active:scale-99"
                >
                  <span className="text-saffron mr-2">→</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-md">
              <div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
              <span className="text-bark text-sm font-medium">স্কিম খুঁজছি...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && !isProcessing && (
          <div className="mt-5">
            {/* ✅ Change 4: AI Feedback */}
            {aiUnderstood && (
              <div className="bg-blue-50 rounded-2xl px-4 py-2 mb-3">
                <p className="text-xs text-blue-600">🤖 আমি বুঝলাম: {aiUnderstood}</p>
              </div>
            )}
            {aiMessage && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-3">
                <p className="text-sm text-orange-800">⚠️ {aiMessage}</p>
              </div>
            )}

            {/* Summary banner */}
            <div className="bg-gradient-to-r from-saffron to-orange-500 text-white rounded-3xl p-4 mb-5 shadow-lg">
              <p className="text-white/80 text-sm mb-1">আপনি পেতে পারেন</p>
              <p className="font-noto text-3xl font-bold">
                ₹{totalBenefit.toLocaleString('bn-IN')}
              </p>
              <p className="text-white/80 text-sm mt-1">প্রতি বছর • {results.length}টি স্কিমে</p>
            </div>

            {/* Query display + reset */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">আপনার অনুসন্ধান:</p>
                <p className="text-sm text-bark font-medium truncate max-w-[220px]">
                  "{transcript || demoText}"
                </p>
              </div>
              <button onClick={handleReset} className="text-saffron text-sm font-semibold bg-orange-50 px-3 py-1.5 rounded-xl">
                নতুন খুঁজুন
              </button>
            </div>

            {/* Scheme cards */}
            {results.map((scheme, i) => (
              <SchemeCard key={scheme.id} scheme={scheme} highlight={i === 0} />
            ))}

            {/* Voice search again */}
            <div className="mt-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <VoiceButton
                  isListening={isListening}
                  onStart={startListening}
                  onStop={stopListening}
                  size="sm"
                />
                <p className="text-xs text-gray-400">আরও খুঁজতে মাইক চাপুন</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats strip (always visible) */}
        {!hasSearched && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { num: '২০০+', label: 'স্কিম' },
              { num: '১ কোটি+', label: 'পরিবার' },
              { num: '₹৪৮,০০০ কোটি', label: 'সুবিধা' },
            ].map((stat, i) => (
              <div key={i} className="card text-center py-3">
                <p className="font-noto font-bold text-saffron text-lg leading-none">{stat.num}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}