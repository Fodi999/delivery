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
      largeGroup: "Większa grupa (5+)"
    },
    ru: {
      title: "Количество персон",
      largeGroup: "Большая группа (5+)"
    },
    uk: {
      title: "Кількість персон",
      largeGroup: "Велика група (5+)"
    },
    en: {
      title: "Number of people",
      largeGroup: "Large group (5+)"
    }
  };

  const t = labels[language];

  return (
    <div className="space-y-2">
      <label className={`text-sm font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
        {t.title}
      </label>
      
      <div className="space-y-2">
        {/* Быстрый выбор 1-4 персоны */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`h-10 rounded-lg flex items-center justify-center text-base font-semibold transition-all ${
                numberOfPeople === num
                  ? "bg-green-500 text-white"
                  : isDark
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
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
            className={`w-full h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
              isDark
                ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {t.largeGroup}
          </button>
        ) : (
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? 'bg-neutral-800' : 'bg-neutral-100'
          }`}>
            <button
              type="button"
              onClick={() => onChange(Math.max(1, numberOfPeople - 1))}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isDark 
                  ? "hover:bg-neutral-700 text-white"
                  : "hover:bg-neutral-200 text-neutral-800"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            
            <div className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
              {numberOfPeople}
            </div>
            
            <button
              type="button"
              onClick={() => onChange(Math.min(20, numberOfPeople + 1))}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500 hover:bg-green-600 text-white transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
