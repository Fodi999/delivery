'use client';

interface AIRecommendationCardProps {
  recommendation: string;
  isDark: boolean;
  language: 'pl' | 'ru' | 'uk' | 'en';
}

export function AIRecommendationCard({ recommendation, isDark, language }: AIRecommendationCardProps) {
  if (!recommendation) return null;

  return (
    <div className="relative group animate-in slide-in-from-bottom-4 duration-1000">
      {/* 2026 Glow Backdrop */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-500/10 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-1000" />
      
      <div className="relative glass-dark p-8 rounded-[2rem] border border-green-500/20 shadow-2xl overflow-hidden">
        {/* Decorative AI Sparkles */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/10 blur-2xl rounded-full" />
        
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl shadow-inner border border-green-500/30">
            🤖
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">
              AI Insight
            </div>
            <p className="text-lg font-bold leading-tight tracking-tight text-white/90">
              "{recommendation}"
            </p>
          </div>
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
      <div className="flex items-center gap-4 px-8 py-6 rounded-[2rem] glass-dark border border-white/5">
        <div className="w-5 h-5 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Analizujemy Twoje potrzeby...</span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground ml-4">
        AI Recommended Extras
      </div>
      <div className="flex flex-wrap gap-4">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAddToCart(suggestion)}
            className="group relative transition-all duration-300"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/50 to-emerald-500/50 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity" />
            <div className="relative flex items-center gap-3 px-6 py-3.5 bg-muted/20 hover:bg-muted/40 rounded-full border border-white/5 transition-all group-hover:scale-105 group-hover:-translate-y-1">
              <span className="text-green-400 font-bold">+</span>
              <span className="text-sm font-black tracking-tight">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
