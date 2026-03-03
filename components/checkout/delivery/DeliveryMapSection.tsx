'use client';

import { useEffect, useRef, useState } from "react";
import { MapboxDeliveryMap } from "@/components/maps/mapbox-delivery-map";
import type { DeliveryCalculation } from "@/lib/delivery-calculator";
import { DELIVERY_SETTINGS } from "@/lib/constants";
import { Expand, X, Navigation, MapPin } from "lucide-react";
import { toast } from "sonner";

interface DeliveryMapSectionProps {
  mapLocation: { lat: number; lng: number } | null;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onDistanceCalculated: (distance: number, duration: number) => void;
  deliveryInfo: DeliveryCalculation | null;
  isDark: boolean;
  language: 'pl' | 'ru' | 'uk' | 'en';
  autoStartCourier?: boolean;
}

// ─── Countdown hook ────────────────────────────────────────────────────────
// Phases: "idle" → "cooking" (COOKING_TIME min) → "delivery" (duration min) → "done"
type Phase = 'idle' | 'cooking' | 'delivery' | 'done';

// Demo durations (seconds) — for visual demo mode
const DEMO_COOK_SECS = 10;   // 10 сек = готовка в демо
const DEMO_DELIVERY_SECS = 15; // 15 сек = доставка в демо

function useDeliveryCountdown(deliveryInfo: DeliveryCalculation | null, language: 'pl' | 'ru' | 'uk' | 'en') {
  const COOK_REAL = DELIVERY_SETTINGS.COOKING_TIME; // 20 min real
  const travelMin = Math.round(deliveryInfo?.duration ?? 0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [secsLeft, setSecsLeft] = useState(0);
  // demo: real seconds counting but display scaled to real minutes
  const [demoMode, setDemoMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // signal to map: flip true when delivery phase starts
  const [triggerMap, setTriggerMap] = useState(false);
  // internal restart counter — incrementing re-runs the useEffect
  const [restartCount, setRestartCount] = useState(0);

  // External restart: call this when user clicks the map button
  const restart = () => {
    if (!deliveryInfo?.allowed) return;
    setRestartCount(c => c + 1);
  };

  const startSequence = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTriggerMap(false);
    setDemoMode(true);
    setPhase('cooking');
    setSecsLeft(DEMO_COOK_SECS);

    let remaining = DEMO_COOK_SECS;

    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        setPhase('delivery');
        setSecsLeft(DEMO_DELIVERY_SECS);
        setTriggerMap(true);
        let dr = DEMO_DELIVERY_SECS;

        intervalRef.current = setInterval(() => {
          dr -= 1;
          setSecsLeft(dr);
          if (dr <= 0) {
            clearInterval(intervalRef.current!);
            setPhase('done');
            setSecsLeft(0);
            setTriggerMap(false);
            // ── Sonner toast при завершении ──
            const toastLabels = {
              pl: { title: 'Dostarczono! 🎉', desc: 'Smacznego!' },
              ru: { title: 'Доставлено! 🎉',  desc: 'Приятного аппетита!' },
              uk: { title: 'Доставлено! 🎉',  desc: 'Смачного!' },
              en: { title: 'Delivered! 🎉',    desc: 'Enjoy your meal!' },
            }[language];
            toast.success(toastLabels.title, {
              id: 'delivery-done',
              description: toastLabels.desc,
              duration: 5000,
            });
          }
        }, 1000);
      }
    }, 1000);
  };

  // Start/restart when deliveryInfo arrives OR restartCount bumps
  useEffect(() => {
    if (!deliveryInfo?.allowed) { setPhase('idle'); setDemoMode(false); return; }
    startSequence();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryInfo?.distance, restartCount]);

  // For display: scale demo seconds → real minutes remaining
  const cookDisplaySecs  = demoMode ? Math.round((secsLeft / DEMO_COOK_SECS) * COOK_REAL * 60) : secsLeft;
  const deliveryDisplaySecs = demoMode ? Math.round((secsLeft / DEMO_DELIVERY_SECS) * travelMin * 60) : secsLeft;
  const displaySecs = phase === 'cooking' ? cookDisplaySecs : deliveryDisplaySecs;

  const cookTotalSecs = demoMode ? DEMO_COOK_SECS : COOK_REAL * 60;
  const deliveryTotalSecs = demoMode ? DEMO_DELIVERY_SECS : (travelMin * 60 || 1);
  const totalSecs = phase === 'cooking' ? cookTotalSecs : deliveryTotalSecs;

  const progress =
    phase === 'idle'     ? 0 :
    phase === 'cooking'  ? ((cookTotalSecs - secsLeft) / cookTotalSecs) * 100 :
    phase === 'delivery' ? ((deliveryTotalSecs - secsLeft) / deliveryTotalSecs) * 100 :
    100;

  const mm = String(Math.floor(displaySecs / 60)).padStart(2, '0');
  const ss = String(displaySecs % 60).padStart(2, '0');

  return { phase, mm, ss, progress, travelMin, cookMin: COOK_REAL, triggerMap, totalSecs, secsLeft, restart };
}

// ─── Countdown UI ───────────────────────────────────────────────────────────
interface CountdownPanelProps {
  cd: ReturnType<typeof useDeliveryCountdown>;
  language: 'pl' | 'ru' | 'uk' | 'en';
  isDark: boolean;
}

function CountdownPanel({ cd, language, isDark }: CountdownPanelProps) {
  const { phase, mm, ss, progress, travelMin, cookMin } = cd;

  const labels = {
    pl: { cooking: 'Przygotowanie', delivery: 'Dostawa', waitCook: 'Kuchnia pracuje…', waitDel: 'Kurier jedzie…', demo: 'DEMO' },
    ru: { cooking: 'Готовка',       delivery: 'Доставка', waitCook: 'Кухня готовит…',  waitDel: 'Курьер в пути…', demo: 'ДЕМО' },
    uk: { cooking: 'Готування',     delivery: 'Доставка', waitCook: 'Кухня готує…',    waitDel: "Кур'єр в дорозі…", demo: 'ДЕМО' },
    en: { cooking: 'Cooking',       delivery: 'Delivery', waitCook: 'Kitchen working…', waitDel: 'Courier on the way…', demo: 'DEMO' },
  }[language];

  if (phase === 'idle' || phase === 'done') return null;

  const isCooking  = phase === 'cooking';
  const isDelivery = phase === 'delivery';
  const barColor   = isCooking ? '#fb923c' : '#22c55e';

  return (
    <div className={`rounded-2xl border backdrop-blur-xl overflow-hidden ${
      isDark ? 'bg-black/70 border-white/10' : 'bg-white/90 border-black/8'
    }`}>

      {/* ── Row 1: status · timer · DEMO ── */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCooking ? 'bg-orange-400' : 'bg-[#22c55e]'}`} />
          <span className={`text-[10px] font-black leading-none ${isDark ? 'text-white/70' : 'text-black/60'}`}>
            {isCooking ? labels.waitCook : labels.waitDel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
            isCooking
              ? 'text-orange-400 border-orange-400/30 bg-orange-400/10'
              : 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10'
          }`}>{labels.demo}</span>
          <span className={`font-mono text-[11px] font-black tabular-nums ${isCooking ? 'text-orange-400' : 'text-[#22c55e]'}`}>
            {mm}:{ss}
          </span>
        </div>
      </div>

      {/* ── Row 2: progress bar ── */}
      <div className="px-4 pb-2">
        <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/8' : 'bg-black/8'}`}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: barColor }} />
        </div>
      </div>

      {/* ── Row 3: steps ── */}
      <div className="px-4 pb-3 flex items-center gap-2">

        {/* Cooking step */}
        <div className={`flex items-center gap-1.5 transition-opacity duration-700 ${isCooking ? 'opacity-100' : 'opacity-45'}`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isDelivery ? 'bg-[#22c55e]/15' : isCooking ? 'bg-orange-400/15' : isDark ? 'bg-white/5' : 'bg-black/5'
          }`}>
            {isDelivery ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isCooking ? 'animate-pulse' : ''}>
                <path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-1-0.4-2-1-3 0 0 1 3-1 4s-3-2-2-5c-1 2-1 4-1 4S8 8 12 2z"/>
              </svg>
            )}
          </div>
          <div>
            <div className="text-[8px] font-black uppercase tracking-widest opacity-45 leading-none">{labels.cooking}</div>
            <div className={`text-[10px] font-black leading-tight ${isCooking ? 'text-orange-400' : ''}`}>{cookMin} min</div>
          </div>
        </div>

        {/* Connector line */}
        <div className="relative flex-1 h-px mx-1">
          <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-white/8' : 'bg-black/8'}`} />
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
            style={{ width: isCooking ? `${progress}%` : '100%', background: isCooking ? '#fb923c' : '#22c55e' }}
          />
          {isCooking && progress > 3 && progress < 97 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.9)] transition-all duration-1000"
              style={{ left: `calc(${progress}% - 4px)` }}
            />
          )}
        </div>

        {/* Delivery step */}
        <div className={`flex items-center gap-1.5 justify-end transition-opacity duration-700 ${isDelivery ? 'opacity-100' : 'opacity-30'}`}>
          <div>
            <div className="text-[8px] font-black uppercase tracking-widest opacity-45 leading-none text-right">{labels.delivery}</div>
            <div className={`text-[10px] font-black leading-tight text-right ${isDelivery ? 'text-[#22c55e]' : ''}`}>{travelMin} min</div>
          </div>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isDelivery ? 'bg-[#22c55e]/15' : isDark ? 'bg-white/5' : 'bg-black/5'
          }`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke={isDelivery ? '#22c55e' : 'currentColor'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={isDelivery ? 'animate-pulse' : ''}>
              <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
              <path d="M5 17H3v-4l2-5h8l2 5h1a2 2 0 0 1 0 4h-1"/>
              <path d="M13 8V4"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export function DeliveryMapSection({
  mapLocation,
  onLocationSelect,
  onDistanceCalculated,
  deliveryInfo,
  isDark,
  language,
  autoStartCourier = false
}: DeliveryMapSectionProps) {
  const countdown = useDeliveryCountdown(deliveryInfo, language);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Закрыть по Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // Блокировать скролл когда открыт фуллскрин
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const labels = {
    pl: {
      deliveryDetails: "Status dostawy",
      distance: "Trasa",
      time: "Czas",
      cost: "Dostawa",
      free: "Gratis",
      addressLabel: "Wskaż punkt na mapie",
      fullscreen: "Pełny ekran",
      close: "Zamknij",
    },
    ru: {
      deliveryDetails: "Статус доставки",
      distance: "Маршрут",
      time: "Время",
      cost: "Доставка",
      free: "Бесплатно",
      addressLabel: "Уточните адрес на карте",
      fullscreen: "На весь экран",
      close: "Закрыть",
    },
    uk: {
      deliveryDetails: "Статус доставки",
      distance: "Маршрут",
      time: "Час",
      cost: "Доставка",
      free: "Безкоштовно",
      addressLabel: "Уточніть адресу на мапі",
      fullscreen: "На весь екран",
      close: "Закрити",
    },
    en: {
      deliveryDetails: "Delivery Status",
      distance: "Route",
      time: "Time",
      cost: "Fee",
      free: "Free",
      addressLabel: "Pinpoint on map",
      fullscreen: "Fullscreen",
      close: "Close",
    }
  };

  const t = labels[language];

  // ── Shared map block (reused in both modes) ──
  const mapBlock = (fullscreen: boolean) => (
    <div className={`relative ${
      fullscreen
        ? 'w-full'
        : 'h-[450px] md:h-[550px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl'
    }`} style={fullscreen ? { height: '100dvh' } : undefined}>
      <MapboxDeliveryMap
        onLocationSelect={onLocationSelect}
        onDistanceCalculated={onDistanceCalculated}
        externalLocation={mapLocation}
        autoStartCourier={autoStartCourier}
        triggerCourierAnimation={countdown.triggerMap}
        onRestartDemo={countdown.restart}
        bottomOffset={fullscreen ? 160 : 0}
        language={language}
      />

      {/* Floating top bar */}
      <div className={`absolute left-0 right-0 flex justify-between items-start pointer-events-none z-10 ${
        fullscreen ? 'top-0 px-4 pt-[max(16px,env(safe-area-inset-top))]' : 'top-4 px-4'
      }`}>
        {/* Address label */}
        <div className={`px-4 py-2.5 rounded-2xl border shadow-xl pointer-events-auto backdrop-blur-xl ${isDark ? 'bg-black/70 border-white/15' : 'bg-white/90 border-black/10'}`}>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-blue-500 shrink-0" strokeWidth={2.5} />
            <span className="text-[11px] font-bold">{deliveryInfo?.distance?.toFixed(1) || '0'} km</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-50 mt-0.5 block">{t.addressLabel}</span>
        </div>

        {/* Right controls */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(f => !f)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-xl ${isDark ? 'bg-black/70 border border-white/15 text-white' : 'bg-white/90 border border-black/10 text-black'}`}
            aria-label={fullscreen ? t.close : t.fullscreen}
          >
            {fullscreen
              ? <X className="w-4 h-4" strokeWidth={2.5} />
              : <Expand className="w-4 h-4" strokeWidth={2.5} />
            }
          </button>

          {/* Navigation link */}
          {mapLocation && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapLocation.lat},${mapLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 bg-primary text-primary-foreground"
              aria-label="Open in Google Maps"
            >
              <Navigation className="w-4 h-4" strokeWidth={2.5} />
            </a>
          )}
        </div>
      </div>

      {/* Bottom demo panel (fullscreen only) */}
      {fullscreen && (
        <div className="absolute left-0 right-0 z-10 px-4"
          style={{ bottom: 'max(20px, env(safe-area-inset-bottom))' }}
        >
          <div className={`rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden ${
            isDark ? 'bg-black/75 border-white/10' : 'bg-white/92 border-black/8'
          }`}>

            {/* Stats row */}
            <div className={`grid grid-cols-3 divide-x px-0 ${isDark ? 'divide-white/8' : 'divide-black/8'}`}>
              <div className="flex flex-col items-center py-2.5">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-35">{t.distance}</span>
                <span className="text-[11px] font-black tabular-nums">{deliveryInfo?.distance?.toFixed(1) || '0'} km</span>
              </div>
              <div className="flex flex-col items-center py-2.5">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-35">{t.time}</span>
                <span className="text-[11px] font-black tabular-nums">{deliveryInfo?.totalTime || '--'} min</span>
              </div>
              <div className="flex flex-col items-center py-2.5">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-35">{t.cost}</span>
                <span className={`text-[11px] font-black tabular-nums ${deliveryInfo?.isFree ? 'text-primary' : ''}`}>
                  {deliveryInfo?.isFree ? t.free : `${deliveryInfo?.price || '0'} zł`}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className={`h-px ${isDark ? 'bg-white/8' : 'bg-black/8'}`} />

            {/* Demo countdown */}
            <CountdownPanel cd={countdown} language={language} isDark={isDark} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Fullscreen modal ── */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] overflow-hidden"
          style={{ width: '100vw', height: '100dvh', background: '#000' }}
        >
          {mapBlock(true)}
        </div>
      )}

      {/* ── Inline view ── */}
      <div className="relative">
        <div className="flex flex-col gap-4">
          {/* Карта */}
          {mapBlock(false)}

          {/* Информация о доставке */}
          <div className={`grid grid-cols-3 gap-2 p-2 rounded-[2rem] border ${
            isDark ? 'bg-black/40 border-white/5' : 'bg-white/80 border-black/5'
          } backdrop-blur-xl`}>
            <div className={`rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center ${isDark ? 'bg-white/4' : 'bg-black/3'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{t.distance}</span>
              <span className="text-sm font-black tracking-tight">{deliveryInfo?.distance?.toFixed(1) || '0'} km</span>
            </div>
            <div className={`rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center border-x ${isDark ? 'bg-white/4 border-white/5' : 'bg-black/3 border-black/5'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{t.time}</span>
              <span className="text-sm font-black tracking-tight">{deliveryInfo?.totalTime || '--'} min</span>
            </div>
            <div className={`rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center ${isDark ? 'bg-white/4' : 'bg-black/3'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{t.cost}</span>
              <span className={`text-sm font-black tracking-tight ${deliveryInfo?.isFree ? 'text-primary' : ''}`}>
                {deliveryInfo?.isFree ? t.free : `${deliveryInfo?.price || '0'} zł`}
              </span>
            </div>
          </div>

          {/* ── Live Countdown ── shows after location selected */}
          <CountdownPanel cd={countdown} language={language} isDark={isDark} />
        </div>
      </div>
    </>
  );
}
