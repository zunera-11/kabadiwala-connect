import React, { useEffect, useRef, useState } from 'react';
import { MicIcon, MicOffIcon } from './icons/Icons';
import { Language } from '../types';
import { LOCALES, SPEECH_LOCALES } from '../i18n/locales';

interface VoiceAssistantProps {
  language: Language;
  onSpeak: (text: string) => void;
  onNotify: (title: string, message: string, type?: 'success' | 'info') => void;
}

type SpeechRecognitionResult = {
  [index: number]: { [index: number]: { transcript: string } };
  length: number;
};

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResult;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language, onSpeak, onNotify }) => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const labels = LOCALES[language];

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const startListening = () => {
    const Recognition =
      (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;
    if (!Recognition) {
      onNotify(labels.voiceInput, labels.voiceUnavailable, 'info');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = SPEECH_LOCALES[language];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim() || '';
      setTranscript(text);
      if (!text) {
        onNotify(labels.voiceInput, labels.noSpeech, 'info');
        return;
      }
      onNotify(labels.recognized, text, 'success');
      const weight = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|किलो|किलो그램|किलो)/i)?.[1];
      const asksForRecycler = /recycl|रिसायकल|रीसायकल|जवळ|पास के|near me/i.test(text);
      if (weight) {
        const material = /computer|कॉम्प्युटर|कंप्यूटर|संगणक/i.test(text)
          ? language === 'MR' ? 'कॉम्प्युटर स्क्रॅप' : language === 'HI' ? 'कंप्यूटर स्क्रैप' : 'Computer scrap'
          : language === 'MR' ? 'स्क्रॅप' : language === 'HI' ? 'स्क्रैप' : 'scrap';
        const structured = language === 'MR'
          ? `मटेरियल: ${material} - अंदाजे वजन: ${weight} किलो`
          : language === 'HI'
          ? `सामग्री: ${material} - अनुमानित वजन: ${weight} किलो`
          : `Material: ${material} - Approximate weight: ${weight} kg`;
        onNotify(labels.recognized, structured, 'success');
        onSpeak(structured);
      } else if (asksForRecycler) {
        const response = language === 'MR'
          ? 'जवळचे रिसायकलर दाखवण्यासाठी Recycler डॅशबोर्डमधील उपलब्ध सुविधा तपासा.'
          : language === 'HI'
          ? 'पास के रिसायकलर देखने के लिए Recycler डैशबोर्ड में उपलब्ध सुविधाएं देखें।'
          : 'Open the Recycler dashboard to view available nearby recycling facilities.';
        onNotify(labels.voiceInput, response, 'info');
        onSpeak(response);
      } else {
        onSpeak(text);
      }
    };
    recognition.onerror = () => onNotify(labels.voiceInput, labels.voiceUnavailable, 'info');
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const toggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={labels.voiceInput}
        title={labels.voiceInput}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
          isListening
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
        }`}
      >
        {isListening ? <MicOffIcon className="w-3.5 h-3.5 text-rose-600" /> : <MicIcon className="w-3.5 h-3.5 text-emerald-600" />}
        <span>{isListening ? (language === 'EN' ? 'Stop' : language === 'MR' ? 'थांबवा' : 'रोकें') : labels.voiceInput}</span>
      </button>
      {transcript && <span className="sr-only">{transcript}</span>}
    </div>
  );
};
