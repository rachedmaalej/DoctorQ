import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { webBrand } from '../../lib/brand';

const SLIDE_DURATION = 4000;
const SLIDE_COUNT = 5;

/* ── Tiny reusable pieces ──────────────────────── */

function Header({ brandName, doctorName, cabinetLabel, langToggle }: { brandName: string; doctorName: string; cabinetLabel: string; langToggle: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 flex-shrink-0">
      <span className="text-[8px] sm:text-[9px] font-bold text-primary-600">{brandName}</span>
      <div className="text-center">
        <div className="text-[5px] sm:text-[6px] text-gray-400">{cabinetLabel}</div>
        <div className="text-[7px] sm:text-[8px] font-semibold text-gray-900">{doctorName}</div>
      </div>
      {langToggle && <span className="text-[7px] sm:text-[8px] text-gray-400">{langToggle}</span>}
    </div>
  );
}

function StatsBar({ waiting, consulting, seen, labels }: { waiting: number; consulting: number; seen: number; labels: { waiting: string; consulting: string; seen: string } }) {
  return (
    <div className="flex border-b border-gray-100 flex-shrink-0">
      <div className="flex-1 text-center py-1">
        <div className="text-[10px] sm:text-xs font-bold text-primary-600">{waiting}</div>
        <div className="text-[5px] sm:text-[6px] text-gray-400">{labels.waiting}</div>
      </div>
      <div className="flex-1 text-center py-1 border-x border-gray-100">
        <div className="text-[10px] sm:text-xs font-bold text-green-600">{consulting}</div>
        <div className="text-[5px] sm:text-[6px] text-gray-400">{labels.consulting}</div>
      </div>
      <div className="flex-1 text-center py-1">
        <div className="text-[10px] sm:text-xs font-bold text-gray-500">{seen}</div>
        <div className="text-[5px] sm:text-[6px] text-gray-400">{labels.seen}</div>
      </div>
    </div>
  );
}

function CallNextBtn({ label }: { label: string }) {
  return (
    <div className="mx-2 my-1.5 bg-primary-500 rounded-lg py-1.5 text-center">
      <span className="text-white text-[7px] sm:text-[8px] font-semibold">🚶 {label}</span>
    </div>
  );
}

function QueueRow({ num, name, time, appt, wait, isNotified, notifiedLabel }: { num: number; name: string; time: string; appt?: string; wait: string; isNotified?: boolean; notifiedLabel: string }) {
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
        <div className="text-[5px] sm:text-[6px] text-blue-500 font-medium mt-0.5 ml-5">💎 {notifiedLabel}</div>
      )}
    </div>
  );
}

function ConsultCard({ name, time, label }: { name: string; time: string; label: string }) {
  return (
    <div className="mx-2 mb-1">
      <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👁 {label}</div>
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

/* ── Slideshow ─────────────────────────────────── */

export default function DoctorSlideshow() {
  const [current, setCurrent] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDE_COUNT);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  const m = {
    brandName: webBrand.name,
    doctorName: t('landing.mockup.doctorName'),
    cabinetLabel: t('landing.mockup.cabinetLabel'),
    langToggle: t('landing.mockup.langToggle'),
    addPatient: t('landing.mockup.addPatient'),
    register: t('landing.mockup.register'),
    queueLabel: t('landing.mockup.queueLabel'),
    consultLabel: t('landing.mockup.consultLabel'),
    doctorPresent: t('landing.mockup.doctorPresent'),
    emptyQueue: t('landing.mockup.emptyQueue'),
    notified: t('landing.mockup.notified'),
    callNext: t('queue.callNext'),
    patient1: t('landing.mockup.patient1'),
    patient2: t('landing.mockup.patient2'),
    patient3: t('landing.mockup.patient3'),
    statsLabels: {
      waiting: t('queue.waiting'),
      consulting: t('queue.inConsultation'),
      seen: t('queue.seenToday'),
    },
  };

  const headerProps = { brandName: m.brandName, doctorName: m.doctorName, cabinetLabel: m.cabinetLabel, langToggle: m.langToggle };

  const scenes = [
    // Scene 1: Empty queue
    <div key={0} className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header {...headerProps} />
      <StatsBar waiting={0} consulting={0} seen={3} labels={m.statsLabels} />
      <div className="flex flex-col items-center justify-center px-3 py-3">
        <span className="material-symbols-outlined text-gray-300 text-2xl sm:text-3xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
        <p className="text-[7px] sm:text-[8px] text-gray-400">{m.emptyQueue}</p>
      </div>
    </div>,

    // Scene 2: Add patient form
    <div key={1} className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header {...headerProps} />
      <StatsBar waiting={0} consulting={0} seen={3} labels={m.statsLabels} />
      <div className="flex flex-col items-center justify-center px-2 py-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full px-2 py-2">
          <div className="text-[8px] sm:text-[9px] font-bold text-gray-900 mb-1.5">{m.addPatient}</div>
          <div className="bg-gray-50 rounded border border-gray-200 px-1.5 py-1 mb-1 text-[7px] sm:text-[8px] text-gray-500">{webBrand.phone.placeholder}</div>
          <div className="bg-gray-50 rounded border border-gray-200 px-1.5 py-1 mb-1 text-[7px] sm:text-[8px] text-gray-700">{m.patient1}</div>
          <div className="flex gap-1 mb-1.5">
            <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-1 py-0.5 text-center text-[7px] sm:text-[8px] text-gray-700">10</div>
            <span className="text-[7px] sm:text-[8px] text-gray-400">:</span>
            <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-1 py-0.5 text-center text-[7px] sm:text-[8px] text-gray-700">00</div>
          </div>
          <div className="bg-primary-500 rounded py-1 text-center">
            <span className="text-white text-[7px] sm:text-[8px] font-semibold">{m.register}</span>
          </div>
        </div>
      </div>
    </div>,

    // Scene 3: One patient in queue
    <div key={2} className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header {...headerProps} />
      <StatsBar waiting={1} consulting={0} seen={3} labels={m.statsLabels} />
      <CallNextBtn label={m.callNext} />
      <div className="px-2">
        <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👥 {m.queueLabel}</div>
        <QueueRow num={1} name={m.patient1} time="18:46" appt="10:00" wait="0 min" notifiedLabel={m.notified} />
      </div>
    </div>,

    // Scene 4: Three patients in queue
    <div key={3} className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header {...headerProps} />
      <StatsBar waiting={3} consulting={0} seen={3} labels={m.statsLabels} />
      <CallNextBtn label={m.callNext} />
      <div className="px-2">
        <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👥 {m.queueLabel}</div>
        <QueueRow num={1} name={m.patient1} time="18:46" appt="10:00" wait="0 min" notifiedLabel={m.notified} />
        <QueueRow num={2} name={m.patient2} time="18:47" appt="10:30" wait="0 min" isNotified notifiedLabel={m.notified} />
        <QueueRow num={3} name={m.patient3} time="18:47" appt="10:45" wait="0 min" notifiedLabel={m.notified} />
      </div>
    </div>,

    // Scene 5: One in consultation, two waiting
    <div key={4} className="h-full flex flex-col justify-center bg-gradient-to-b from-primary-50/50 to-white">
      <Header {...headerProps} />
      <StatsBar waiting={2} consulting={1} seen={3} labels={m.statsLabels} />
      <div className="mx-2 mt-1 mb-0.5 flex items-center gap-1">
        <div className="w-5 h-3 bg-green-500 rounded-full relative">
          <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
        </div>
        <span className="text-[6px] sm:text-[7px] text-gray-600">{m.doctorPresent}</span>
      </div>
      <ConsultCard name={m.patient1} time="2 min" label={m.consultLabel} />
      <CallNextBtn label={m.callNext} />
      <div className="px-2">
        <div className="text-[5px] sm:text-[6px] text-gray-400 uppercase font-semibold mb-0.5">👥 {m.queueLabel}</div>
        <QueueRow num={1} name={m.patient2} time="18:47" appt="10:30" wait="1 min" isNotified notifiedLabel={m.notified} />
        <QueueRow num={2} name={m.patient3} time="18:47" appt="10:45" wait="1 min" notifiedLabel={m.notified} />
      </div>
    </div>,
  ];

  return (
    <div className="relative h-full">
      {scenes.map((scene, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {scene}
        </div>
      ))}
    </div>
  );
}
