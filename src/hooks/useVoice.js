import { useState, useRef, useCallback } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('আপনার ব্রাউজার ভয়েস সাপোর্ট করে না। Chrome ব্যবহার করুন।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-IN';
    recognition.continuous = true;       // ← থামবে না, সব শুনবে
    recognition.interimResults = true;   // ← বলতে বলতে দেখাবে
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + ' ';
          finalTranscriptRef.current = final;
        } else {
          interim += text;
        }
      }

      setInterimTranscript(interim);
      if (final.trim()) setTranscript(final.trim());

      // ৩ সেকেন্ড চুপ থাকলে অটো বন্ধ
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript('');
      if (event.error === 'not-allowed') {
        setError('মাইক্রোফোন অনুমতি দিন');
      } else if (event.error === 'no-speech') {
        setError('কিছু শুনতে পাইনি। আবার চেষ্টা করুন।');
      } else if (event.error === 'network') {
        setError('ইন্টারনেট সংযোগ চেক করুন।');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      clearTimeout(silenceTimerRef.current);
      // Final transcript set করি
      if (finalTranscriptRef.current.trim()) {
        setTranscript(finalTranscriptRef.current.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}
