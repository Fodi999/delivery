'use client';

interface AIRecommendationCardProps {
  recommendation: string;
  isDark: boolean;
  language: 'pl' | 'ru' | 'uk' | 'en';
}

export function AIRecommendationCard({ recommendation, isDark, language }: AIRecommendationCardProps) {
  if (!recommendation) return null;

  return (
    <div className={`p-4 rounded-xl border ${
      isDark 
        ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/10 border-green-700/30' 
        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
    }`}>
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isDark ? 'bg-green-500/20' : 'bg-green-100'
        }`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#22c55e" : "#16a34a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10 4 4 0 0 1-4 4h-1.5a2 2 0 0 0-1.5 3.5 10 10 0 1 1-15-8.5"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <circle cx="15.5" cy="8.5" r="1.5"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AISuggestionsProps {
  suggestions: string[];
  onAddToCart: (dishName: string) => void;
  isLoading: boolean;
  isDark: boolean;
}

export function AISuggestions({ suggestions, onAddToCart, isLoading, isDark }: AISuggestionsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
          isDark ? 'border-green-400' : 'border-green-600'
        }`}></div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onAddToCart(suggestion)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
            isDark
              ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
              : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
          }`}
        >
          + {suggestion}
        </button>
      ))}
    </div>
  );
}
