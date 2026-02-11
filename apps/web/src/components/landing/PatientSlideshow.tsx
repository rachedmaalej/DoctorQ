import { useState, useEffect } from 'react';

const SLIDE_DURATION = 4000;
const SLIDE_COUNT = 6;

/* ── Reusable patient-side pieces ──────────────── */

function LiveBadge() {
  return (
    <div className="flex items-center justify-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      <span className="text-[6px] sm:text-[7px] font-semibold text-green-600">En direct</span>
    </div>
  );
}

function JourneyIcons({ ahead, patientBg, chairColor, doorIcon, doorColor }: {
  ahead: number;
  patientBg: string;
  chairColor: string;
  doorIcon: string;
  doorColor: string;
}) {
  const chairs = Math.min(ahead, 3);
  const overflow = ahead - chairs;
  return (
    <div className="flex items-center justify-center gap-1 my-1">
      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${patientBg}`}>
        <span className="material-symbols-outlined text-[8px] sm:text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
      </div>
      {Array.from({ length: chairs }).map((_, i) => (
        <span key={i} className={`material-symbols-outlined text-[9px] sm:text-[11px] ${chairColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>event_seat</span>
      ))}
      {overflow > 0 && <span className={`text-[6px] sm:text-[7px] font-bold ${chairColor}`}>+{overflow}</span>}
      <span className={`material-symbols-outlined text-[9px] sm:text-[11px] ${doorColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{doorIcon}</span>
    </div>
  );
}

function TicketCard({ num, gradient }: { num: number; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-lg w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center shadow-md mx-auto`}>
      <span className="text-white font-extrabold text-xs sm:text-sm">#{num}</span>
    </div>
  );
}

function WaitCard({ minutes }: { minutes: number }) {
  return (
    <div className="bg-white/70 rounded-lg px-2 py-1 sm:py-1.5 border border-white/50 my-1">
      <div className="text-[5px] sm:text-[6px] font-semibold text-primary-600 uppercase tracking-wider">Attente estimée</div>
      <div className="text-xs sm:text-sm font-extrabold text-gray-900">~{minutes} min</div>
    </div>
  );
}

function LeaveLink() {
  return (
    <div className="mt-1">
      <span className="text-[5px] sm:text-[6px] text-rose-400 flex items-center justify-center gap-0.5">
        <span className="material-symbols-outlined text-[7px] sm:text-[8px]">logout</span>
        Quitter le Saf
      </span>
    </div>
  );
}

/* ── Scenes ────────────────────────────────────── */

/* Scene 1: Check-in / join queue page */
function Scene1() {
  return (
    <div className="h-full flex flex-col justify-center bg-white">
      <div className="px-2 pb-1 text-center">
        <div className="flex items-center justify-center gap-1 text-[7px] sm:text-[8px] text-gray-500 mb-1.5">
          <span className="material-symbols-outlined text-[10px] sm:text-xs">local_hospital</span>
          Cabinet Dr Maalej
        </div>
        <div className="bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg py-2 px-3 mb-2">
          <span className="material-symbols-outlined text-white text-sm sm:text-base mb-0.5 block">person_add</span>
          <div className="text-white text-[8px] sm:text-[9px] font-bold">Rejoignez le Saf</div>
        </div>
      </div>
      <div className="px-2.5">
        <div className="text-[6px] sm:text-[7px] text-gray-600 font-medium mb-0.5">📞 Téléphone *</div>
        <div className="bg-gray-50 rounded border border-gray-200 px-1.5 py-1 mb-1.5 text-[7px] sm:text-[8px] text-gray-400">+216</div>
        <div className="text-[6px] sm:text-[7px] text-gray-600 font-medium mb-0.5">👤 Votre nom</div>
        <div className="bg-gray-50 rounded border border-gray-200 px-1.5 py-1 mb-2 text-[7px] sm:text-[8px] text-gray-400">Comment vous appelez-vous?</div>
        <div className="bg-primary-500 rounded-lg py-1.5 text-center">
          <span className="text-white text-[7px] sm:text-[8px] font-semibold">📋 Prendre ma place</span>
        </div>
      </div>
      <div className="px-2 py-1.5 flex justify-center gap-2 text-[5px] sm:text-[6px] text-gray-400">
        <span>🔒 Infos privées</span>
        <span>📍 Suivi en temps réel</span>
      </div>
    </div>
  );
}

/* Scene 2: Position #4 — far (blue) */
function Scene2() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-br from-blue-50 to-teal-50 text-center">
      <LiveBadge />
      <div className="px-2"><h2 className="text-[9px] sm:text-[10px] font-bold text-gray-900">Hela, vous êtes dans le Saf!</h2></div>
      <p className="text-[6px] sm:text-[7px] text-gray-500 font-medium">3 personnes avant vous</p>
      <div className="flex flex-col justify-center px-2.5">
        <WaitCard minutes={40} />
        <JourneyIcons ahead={3} patientBg="bg-primary-100 text-primary-600" chairColor="text-primary-400" doorIcon="door_front" doorColor="text-gray-300" />
        <TicketCard num={4} gradient="from-blue-400 via-blue-500 to-blue-600" />
        <LeaveLink />
      </div>
    </div>
  );
}

/* Scene 3: Position #3 — closer (teal) */
function Scene3() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-br from-teal-50 to-cyan-50 text-center">
      <LiveBadge />
      <div className="px-2"><h2 className="text-[9px] sm:text-[10px] font-bold text-gray-900">Hela, vous approchez!</h2></div>
      <p className="text-[6px] sm:text-[7px] text-gray-500 font-medium">2 personnes avant vous</p>
      <div className="flex flex-col justify-center px-2.5">
        <WaitCard minutes={30} />
        <JourneyIcons ahead={2} patientBg="bg-teal-100 text-teal-600" chairColor="text-teal-400" doorIcon="door_front" doorColor="text-gray-300" />
        <TicketCard num={3} gradient="from-teal-400 via-teal-500 to-teal-600" />
        <LeaveLink />
      </div>
    </div>
  );
}

/* Scene 4: Position #2 — almost (amber) */
function Scene4() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-br from-amber-50 to-orange-50 text-center">
      <LiveBadge />
      <div className="px-2"><h2 className="text-[9px] sm:text-[10px] font-bold text-amber-700">Hela, c'est bientôt votre tour!</h2></div>
      <p className="text-[6px] sm:text-[7px] text-gray-500 font-medium">1 personne avant vous</p>
      <div className="flex flex-col justify-center px-2.5">
        <WaitCard minutes={20} />
        <JourneyIcons ahead={1} patientBg="bg-amber-200 text-amber-700" chairColor="text-amber-500" doorIcon="door_front" doorColor="text-amber-300" />
        <TicketCard num={2} gradient="from-amber-400 via-yellow-400 to-amber-500" />
        <LeaveLink />
      </div>
    </div>
  );
}

/* Scene 5: Position #1 — next (green) */
function Scene5() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-center">
      <LiveBadge />
      <div className="px-2"><h2 className="text-[9px] sm:text-[10px] font-bold text-green-700">Hela, vous êtes le prochain!</h2></div>
      <div className="flex flex-col justify-center px-2.5">
        <JourneyIcons ahead={0} patientBg="bg-green-200 text-green-700" chairColor="text-green-500" doorIcon="door_front" doorColor="text-green-400" />
        <p className="text-[6px] sm:text-[7px] text-green-600 font-medium mb-1">Présentez-vous à l'accueil</p>
        <TicketCard num={1} gradient="from-emerald-400 via-green-500 to-emerald-600" />
        <LeaveLink />
      </div>
    </div>
  );
}

/* Scene 6: Your turn! */
function Scene6() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-br from-green-100 to-emerald-100 text-center">
      <LiveBadge />
      <div className="px-2"><h2 className="text-[10px] sm:text-[11px] font-extrabold text-green-700">Hela, C'EST VOTRE TOUR!</h2></div>
      <div className="flex flex-col items-center justify-center px-2.5">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-300 flex items-center justify-center text-green-700">
            <span className="material-symbols-outlined text-[10px] sm:text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
          <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>door_open</span>
        </div>
        <p className="text-[6px] sm:text-[7px] text-green-700 font-medium mb-2">Entrez dans le cabinet</p>
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-full">
          <span className="material-symbols-outlined text-green-500 text-base sm:text-lg block mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          <div className="text-[7px] sm:text-[9px] font-bold text-green-700">Hela, le docteur vous attend!</div>
        </div>
      </div>
    </div>
  );
}

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];

/* ── Slideshow ─────────────────────────────────── */

export default function PatientSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDE_COUNT);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full">
      {SCENES.map((Scene, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Scene />
        </div>
      ))}
    </div>
  );
}
