import { useState, useEffect } from 'react';
import { webBrand } from '../../lib/brand';

const SLIDE_DURATION = 4000;
const SLIDE_COUNT = 5;

/* ── Tiny reusable pieces ──────────────────────── */

function Header() {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 flex-shrink-0">
      <span className="text-[8px] sm:text-[9px] font-bold text-primary-600">BléSAF</span>
      <div className="text-center">
        <div className="text-[5px] sm:text-[6px] text-gray-400">Cabinet</div>
        <div className="text-[7px] sm:text-[8px] font-semibold text-gray-900">Rached Maalej</div>
      </div>
      <span className="text-[7px] sm:text-[8px] text-gray-400">عربي</span>
    </div>
  );
}

function StatsBar({ waiting, consulting, seen }: { waiting: number; consulting: number; seen: number }) {
  return (
    <div className="flex border-b border-gray-100 flex-shrink-0">
      <div className="flex-1 text-center py-1">
        <div className="text-[10px] sm:text-xs font-bold text-primary-600">{waiting}</div>
        <div className="text-[5px] sm:text-[6px] text-gray-400">En Attente</div>
      </div>
      <div className="flex-1 text-center py-1 border-x border-gray-100">
        <div className="text-[10px] sm:text-xs font-bold text-green-600">{consulting}</div>
        <div className="text-[5px] sm:text-[6px] text-gray-400">En Consultation</div>
      </div>
      <div className="flex-1 text-center py-1">
        <div className="text-[10px] sm:text-xs font-bold text-gray-500">{seen}</div>
        <div className="text-[5px] sm:text-[6px] text-gray-400">Vus aujourd'hui</div>
      </div>
    </div>
  );
}

function CallNextBtn() {
  return (
    <div className="mx-2 my-1.5 bg-primary-500 rounded-lg py-1.5 text-center">
      <span className="text-white text-[7px] sm:text-[8px] font-semibold">🚶 Appeler Suivant</span>
    </div>
  );
}

function QueueRow({ num, name, time, appt, wait, isNotified }: { num: number; name: string; time: string; appt?: string; wait: string; isNotified?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-1.5 py-1 mb-1">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center text-[7px] sm:text-[8px] font-bold flex-shrink-0">#{num}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] sm:text-[9px] font-semibold text-gray-900 truncate">{name}</div>
          <div className="flex items-center gap-1 text-[5px] sm:text-[6px] text-gray-400">
            <span>→ {time}</span>
            {appt && <span className="text-primary-500">📅 {appt}</span>}
            <span>⏳ {wait}</span>
          </div>
        </div>
      </div>
      {isNotified && (
        <div className="text-[5px] sm:text-[6px] text-blue-500 font-medium mt-0.5 ml-5">💎 Notifié</div>
      )}
    </div>
  );
}

function ConsultCard({ name, time }: { name: string; time: string }) {
  return (
    <div className="mx-2 mb-1">
      <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👁 En consultation</div>
      <div className="bg-primary-50 border border-primary-200 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary-600 text-[10px] sm:text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <div>
          <div className="text-[8px] sm:text-[9px] font-semibold text-gray-900">{name}</div>
          <div className="text-[5px] sm:text-[6px] text-gray-400">⏱ {time}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Scenes ────────────────────────────────────── */

function Scene1() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header />
      <StatsBar waiting={0} consulting={0} seen={3} />
      <div className="flex flex-col items-center justify-center px-3 py-3">
        <span className="material-symbols-outlined text-gray-300 text-2xl sm:text-3xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
        <p className="text-[7px] sm:text-[8px] text-gray-400">La salle d'attente est vide</p>
      </div>
    </div>
  );
}

function Scene2() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header />
      <StatsBar waiting={0} consulting={0} seen={3} />
      <div className="flex flex-col items-center justify-center px-2 py-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full px-2 py-2">
          <div className="text-[8px] sm:text-[9px] font-bold text-gray-900 mb-1.5">Ajouter un Patient</div>
          <div className="bg-gray-50 rounded border border-gray-200 px-1.5 py-1 mb-1 text-[7px] sm:text-[8px] text-gray-500">{webBrand.phone.placeholder}</div>
          <div className="bg-gray-50 rounded border border-gray-200 px-1.5 py-1 mb-1 text-[7px] sm:text-[8px] text-gray-700">Maya</div>
          <div className="flex gap-1 mb-1.5">
            <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-1 py-0.5 text-center text-[7px] sm:text-[8px] text-gray-700">10</div>
            <span className="text-[7px] sm:text-[8px] text-gray-400">:</span>
            <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-1 py-0.5 text-center text-[7px] sm:text-[8px] text-gray-700">00</div>
          </div>
          <div className="bg-primary-500 rounded py-1 text-center">
            <span className="text-white text-[7px] sm:text-[8px] font-semibold">Enregistrer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Scene3() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header />
      <StatsBar waiting={1} consulting={0} seen={3} />
      <CallNextBtn />
      <div className="px-2">
        <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👥 File d'attente</div>
        <QueueRow num={1} name="Maya" time="18:46" appt="10:00" wait="0 min" />
      </div>
    </div>
  );
}

function Scene4() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header />
      <StatsBar waiting={3} consulting={0} seen={3} />
      <CallNextBtn />
      <div className="px-2">
        <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👥 File d'attente</div>
        <QueueRow num={1} name="Maya" time="18:46" appt="10:00" wait="0 min" />
        <QueueRow num={2} name="Yasmine" time="18:47" appt="10:30" wait="0 min" isNotified />
        <QueueRow num={3} name="Hedi" time="18:47" appt="10:45" wait="0 min" />
      </div>
    </div>
  );
}

function Scene5() {
  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header />
      <StatsBar waiting={2} consulting={1} seen={3} />
      {/* Doctor present toggle */}
      <div className="mx-2 mt-1 mb-0.5 flex items-center gap-1">
        <div className="w-5 h-3 bg-green-500 rounded-full relative">
          <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
        </div>
        <span className="text-[6px] sm:text-[7px] text-gray-600">Docteur présent</span>
      </div>
      <ConsultCard name="Maya" time="2 min" />
      <CallNextBtn />
      <div className="px-2">
        <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👥 File d'attente</div>
        <QueueRow num={1} name="Yasmine" time="18:47" appt="10:30" wait="1 min" isNotified />
        <QueueRow num={2} name="Hedi" time="18:47" appt="10:45" wait="1 min" />
      </div>
    </div>
  );
}

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5];

/* ── Slideshow ─────────────────────────────────── */

export default function DoctorSlideshow() {
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
