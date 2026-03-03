'use client';

interface AIRecommendationCardProps {
  recommendation: string;
  isDark: boolean;
  language: 'pl' | 'ru' | 'uk' | 'en';
}

export function AIRecommendationCard({ recommendation, isDark, language }: AIRecommendationCardProps) {
  if (!recommendation) return null;

  const label = { pl: 'AI Insight', ru: 'AI Анализ', uk: 'AI Аналіз', en: 'AI Insight' }[language];

  return (
    <div className={`flex items-start gap-4 px-5 py-4 rounded-2xl border ${
      isDark
        ? 'bg-[#22c55e]/5 border-[#22c55e]/15'
        : 'bg-[#22c55e]/5 border-[#22c55e]/20'
    }`}>
      {/* Robot/AI icon */}
      <div className="w-9 h-9 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="13" rx="2"/>
          <path d="M9 8V5a3 3 0 0 1 6 0v3"/>
          <circle cx="9" cy="14" r="1" fill="#22c55e" stroke="none"/>
          <circle cx="15" cy="14" r="1" fill="#22c55e" stroke="none"/>
          <path d="M12 2v2"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#22c55e]/70 mb-1">{label}</div>
        <p className={`text-sm font-semibold leading-snug ${isDark ? 'text-white/80' : 'text-black/70'}`}>
          &ldquo;{recommendation}&rdquo;
        </p>
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
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${isDark ? 'bg-white/3 border-white/8' : 'bg-black/3 border-black/6'}`}>
        <div className="w-4 h-4 border-2 border-[#22c55e]/20 border-t-[#22c55e] rounded-full animate-spin shrink-0" />
        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Analizujemy…</span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 dark:text-white/30">
        AI Recommended Extras
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAddToCart(suggestion)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
              isDark
                ? 'bg-white/4 border-white/10 hover:bg-[#22c55e]/10 hover:border-[#22c55e]/30 text-white/80 hover:text-[#22c55e]'
                : 'bg-black/3 border-black/8 hover:bg-[#22c55e]/8 hover:border-[#22c55e]/25 text-black/70 hover:text-[#22c55e]'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
