'use client';

interface PersonSelectorProps {
  numberOfPeople: number;
  onChange: (value: number) => void;
  language: 'pl' | 'ru' | 'uk' | 'en';
  isDark: boolean;
}

export function PersonSelector({ numberOfPeople, onChange, language, isDark }: PersonSelectorProps) {
  const labels = {
    pl: {
      title: "Liczba osób",
      largeGroup: "Większa grupa (5+)",
      hint: "Sztućce i sosy"
    },
    ru: {
      title: "Количество персон",
      largeGroup: "Большая группа (5+)",
      hint: "Приборы и соусы"
    },
    uk: {
      title: "Кількість персон",
      largeGroup: "Велика група (5+)",
      hint: "Прилади та соуси"
    },
    en: {
      title: "Number of people",
      largeGroup: "Large group (5+)",
      hint: "Cutlery & sauces"
    }
  };

  const t = labels[language];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 block dark:text-white/50">
          {t.title}
        </label>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 dark:text-primary/70">{t.hint}</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Быстрый выбор 1-4 персоны */}
        <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-full border border-black/10 dark:border-white/10 backdrop-blur-sm">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-all duration-500 scale-95 hover:scale-100 ${
                numberOfPeople === num
                  ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110 z-10"
                  : "text-foreground/40 dark:text-white/40 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Кнопка для больших групп */}
        {numberOfPeople <= 4 ? (
          <button
            type="button"
            onClick={() => onChange(5)}
            className="h-14 px-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all duration-500 glass-dark border border-white/10 hover:border-primary/50 hover:bg-primary/10 text-foreground/60 dark:text-white/60 hover:text-primary dark:hover:text-primary whitespace-nowrap"
          >
            {t.largeGroup}
          </button>
        ) : (
          <div className="flex items-center gap-4 px-3 py-1.5 rounded-full glass-dark border border-primary/30 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => onChange(Math.max(1, numberOfPeople - 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            
            <div className="text-2xl font-black min-w-[1.5rem] text-center">
              {numberOfPeople}
            </div>
            
            <button
              type="button"
              onClick={() => onChange(Math.min(20, numberOfPeople + 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-primary hover:scale-110 text-primary-foreground transition-all shadow-lg shadow-primary/20"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
