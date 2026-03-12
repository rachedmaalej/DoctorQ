/**
 * GuidedTour — BleSaf onboarding tour
 *
 * Triggered from OnboardingFlow (screen 3 / signup) by setting
 * tourStore.state = 'WELCOME'. Renders as a full-screen overlay
 * inside ReceptionistDashboard.
 *
 * Animation engine ported verbatim from design/onboarding/blesaf-guided-tour.html
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useTourStore } from './tourStore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HoleGeom {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
}

interface DemoPatient {
  name: string;
  wait: string;
  visible: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// 272 × 560 is the SVG coordinate space (same as HTML prototype)
const SVG_W = 272;
const SVG_H = 560;
const FULL_HOLE: HoleGeom = { x: 4, y: 4, w: 264, h: 552, rx: 24 };

const ALL_PATIENTS: DemoPatient[] = [
  { name: 'Mohamed', wait: '0 min', visible: false },
  { name: 'Lilia',   wait: '3 min', visible: false },
  { name: 'Fadi',    wait: '5 min', visible: false },
  { name: 'Ali',     wait: '8 min', visible: false },
  { name: 'Olfa',    wait: '11 min', visible: false },
];

// ─── Easing functions (from HTML prototype) ───────────────────────────────────

const Ease = {
  outBack:    (t: number) => { const s = 1.35; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  inOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  linear:     (t: number) => t,
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function delay(ms: number) { return new Promise<void>(res => setTimeout(res, ms)); }

// ─── Props ────────────────────────────────────────────────────────────────────

interface GuidedTourProps {
  /** The bs-dashboard root div — position reference for the overlay */
  screenRef: RefObject<HTMLDivElement>;
  /** The person_add button in QuickAddBar */
  addBtnRef: RefObject<HTMLButtonElement>;
  /** The presence pill button in Header */
  presencePillRef: RefObject<HTMLButtonElement>;
  /** Called once when the tour starts (to open the real queue) */
  onOpenQueue: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GuidedTour({
  screenRef,
  addBtnRef,
  presencePillRef,
  onOpenQueue,
}: GuidedTourProps) {
  const { t } = useTranslation();
  const { state: tourState, setState, completeTour } = useTourStore();

  // ── Direct-DOM refs for smooth RAF animation (avoid setState per frame) ──
  const spHoleRef   = useRef<SVGRectElement>(null);
  const spRectRef   = useRef<SVGRectElement>(null);
  const spBorderRef = useRef<HTMLDivElement>(null);
  const tooltipRef  = useRef<HTMLDivElement>(null);

  // ── Refs to elements inside the tour overlay ──────────────────────────────
  const firstKebabRef    = useRef<HTMLButtonElement>(null);
  const lastKebabRef     = useRef<HTMLButtonElement>(null); // Olfa — spotlight target
  const whatsappItemRef  = useRef<HTMLButtonElement>(null);
  const fakeNameInputRef = useRef<HTMLDivElement>(null);
  const fakePhoneInputRef= useRef<HTMLDivElement>(null);
  const fakeAddBtnRef    = useRef<HTMLDivElement>(null);
  const ghostRef         = useRef<HTMLDivElement>(null);
  const rippleRef        = useRef<HTMLDivElement>(null);

  // ── Animation cancel refs ─────────────────────────────────────────────────
  const morphRAF   = useRef<number>(0);
  const fadeRAF    = useRef<number>(0);
  const currentHole= useRef<HoleGeom>({ ...FULL_HOLE });

  // ── Sequence cancellation ─────────────────────────────────────────────────
  const seqVersion = useRef(0);

  // ── React state (re-renders on significant UI changes only) ──────────────
  const [tooltipCfg, setTooltipCfg] = useState<{
    title: string; desc: string; nudge?: string;
    arrow: 'up' | 'down'; step: number;
    showFinish?: boolean;
  } | null>(null);
  const [tooltipTop, setTooltipTop]           = useState(0);
  const [tooltipArrowLeft, setTooltipArrowLeft] = useState(24);
  const [tooltipPE, setTooltipPE]             = useState(false);   // pointer-events

  const [demoPatients, setDemoPatients] = useState<DemoPatient[]>([]);
  const [consultingName, setConsultingName] = useState<string | null>(null);

  // modal state
  const [showModal, setShowModal]             = useState(false);
  const [modalName, setModalName]             = useState('');
  const [modalPhone, setModalPhone]           = useState('');
  const [modalNameFocused, setModalNameFocused] = useState(false);
  const [modalPhoneFocused, setModalPhoneFocused] = useState(false);
  const [phoneCursor, setPhoneCursor]         = useState(0);
  const [modalBtnPress, setModalBtnPress]     = useState(false);

  // fill overlay
  const [showFill, setShowFill]  = useState(false);
  const [fillGo, setFillGo]      = useState(false);

  // true once Mohamed appears — unlocks showDemoQueue during MODAL_GHOST tail
  const [queueRevealPhase, setQueueRevealPhase] = useState(false);

  // presence
  const [showPresDD, setShowPresDD]           = useState(false);
  const [presentSelected, setPresentSelected] = useState(false);

  // context menu
  const [showCtx, setShowCtx]     = useState(false);
  const [ctxPatient, setCtxPatient] = useState({ name: '', sub: '' });

  // ── Coordinate helpers ────────────────────────────────────────────────────

  const getContainer = useCallback(() => screenRef.current, [screenRef]);

  /** Convert a DOM element's bounding rect to 272×560 SVG coordinates */
  const measureEl = useCallback((el: Element, pad = 0): HoleGeom => {
    const container = getContainer();
    if (!container) return { ...FULL_HOLE };
    const sr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const sx = SVG_W / sr.width;
    const sy = SVG_H / sr.height;
    return {
      x:  (er.left - sr.left) * sx - pad,
      y:  (er.top  - sr.top)  * sy - pad,
      w:  er.width  * sx + pad * 2,
      h:  er.height * sy + pad * 2,
      rx: 0,
    };
  }, [getContainer]);

  /** Convert SVG Y coordinate to pixel CSS top (relative to overlay) */
  const svgYtoPx = useCallback((svgY: number): number => {
    const container = getContainer();
    if (!container) return svgY;
    return svgY * (container.offsetHeight / SVG_H);
  }, [getContainer]);

  // ── Direct-DOM animation engine ───────────────────────────────────────────

  const renderHole = useCallback((h: HoleGeom) => {
    const hole = spHoleRef.current;
    const border = spBorderRef.current;
    if (!hole || !border) return;
    const safeW  = Math.max(1, h.w);
    const safeH  = Math.max(1, h.h);
    const safeRx = Math.max(0, h.rx);
    hole.setAttribute('x',      String(h.x));
    hole.setAttribute('y',      String(h.y));
    hole.setAttribute('width',  String(safeW));
    hole.setAttribute('height', String(safeH));
    hole.setAttribute('rx',     String(safeRx));
    hole.setAttribute('ry',     String(safeRx));
    // Border in percentage coordinates (works at any screen size)
    const pad = 3;
    border.style.left         = `${((h.x - pad) / SVG_W) * 100}%`;
    border.style.top          = `${((h.y - pad) / SVG_H) * 100}%`;
    border.style.width        = `${((safeW + pad * 2) / SVG_W) * 100}%`;
    border.style.height       = `${((safeH + pad * 2) / SVG_H) * 100}%`;
    border.style.borderRadius = `${((safeRx + pad) / SVG_W) * 100}%`;
    currentHole.current = { ...h };
  }, []);

  const morphHole = useCallback((
    from: HoleGeom, to: HoleGeom, dur: number,
    easeFn: (t: number) => number, onComplete?: () => void,
  ) => {
    cancelAnimationFrame(morphRAF.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      const ePos = easeFn(t);
      // Clamp for dimension interpolation to prevent negative values (Bug 4)
      const eDim = Math.min(Math.max(ePos, 0), 1.5);
      renderHole({
        x:  lerp(from.x,  to.x,  ePos),
        y:  lerp(from.y,  to.y,  ePos),
        w:  lerp(from.w,  to.w,  eDim),
        h:  lerp(from.h,  to.h,  eDim),
        rx: lerp(from.rx, to.rx, eDim),
      });
      if (t < 1) morphRAF.current = requestAnimationFrame(tick);
      else { renderHole(to); onComplete?.(); }
    };
    morphRAF.current = requestAnimationFrame(tick);
  }, [renderHole]);

  const fadeOverlay = useCallback((
    from: number, to: number, dur: number, onComplete?: () => void,
  ) => {
    cancelAnimationFrame(fadeRAF.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      const v = lerp(from, to, Ease.linear(t));
      spRectRef.current?.setAttribute('opacity', v.toFixed(3));
      if (t < 1) fadeRAF.current = requestAnimationFrame(tick);
      else { spRectRef.current?.setAttribute('opacity', String(to)); onComplete?.(); }
    };
    fadeRAF.current = requestAnimationFrame(tick);
  }, []);

  // ── Spotlight helpers ─────────────────────────────────────────────────────

  const disableSpotlight = useCallback(() => {
    cancelAnimationFrame(morphRAF.current);
    cancelAnimationFrame(fadeRAF.current);
    spRectRef.current?.setAttribute('opacity', '0');
    if (spBorderRef.current) {
      spBorderRef.current.classList.remove('tour-border-on', 'tour-border-breathe');
    }
    // Critical Bug 3: must clear inline pointer-events on tooltip
    setTooltipPE(false);
    setTooltipCfg(null);
  }, []);

  const positionTooltip = useCallback((
    targetEl: Element | null, pad: number, arrow: 'up' | 'down',
  ) => {
    if (!targetEl) return;
    const container = getContainer();
    const hole = measureEl(targetEl, pad);
    const tipEl = tooltipRef.current;
    if (!tipEl) return;
    const tipHeightSvg = (tipEl.offsetHeight / (container?.offsetHeight ?? 812)) * SVG_H;
    const GAP = 14;
    let svgTop: number;
    if (arrow === 'down') {
      // Tooltip sits ABOVE the target (Bug 5: measure actual height)
      svgTop = Math.max(6, hole.y - tipHeightSvg - GAP);
    } else {
      svgTop = hole.y + hole.h + GAP;
    }
    setTooltipTop(svgYtoPx(svgTop));

    // Position the arrow to point at the horizontal center of the spotlighted target
    if (container) {
      const targetCenterPx = ((hole.x + hole.w / 2) / SVG_W) * container.offsetWidth;
      const TOOLTIP_LEFT = 16;
      const ARROW_HALF   = 7;
      const rawLeft = targetCenterPx - TOOLTIP_LEFT - ARROW_HALF;
      setTooltipArrowLeft(Math.max(10, Math.min(rawLeft, tipEl.offsetWidth - 24)));
    }
  }, [measureEl, svgYtoPx, getContainer]);

  const showSpotlightOn = useCallback((
    targetEl: Element | null,
    pad: number, rx: number,
    cfg: NonNullable<typeof tooltipCfg>,
    arrow: 'up' | 'down' = 'up',
  ) => {
    if (!targetEl) return;
    const hole = { ...measureEl(targetEl, pad), rx };

    renderHole(FULL_HOLE);
    fadeOverlay(0, 1, 360, () => {
      morphHole(FULL_HOLE, hole, 950, Ease.inOutCubic, () => {
        spBorderRef.current?.classList.add('tour-border-on');
        setTimeout(() => spBorderRef.current?.classList.add('tour-border-breathe'), 80);
        setTimeout(() => {
          setTooltipCfg({ ...cfg, arrow });
          // Re-measure after tooltip renders (Bug 5)
          setTimeout(() => {
            positionTooltip(targetEl, pad, arrow);
            // Enable pointer-events after animation settles (Bug 2)
            setTimeout(() => setTooltipPE(true), 520);
          }, 30);
        }, 180);
      });
    });
  }, [measureEl, renderHole, fadeOverlay, morphHole, positionTooltip]);

  // ── Ghost cursor helpers ───────────────────────────────────────────────────

  const ghostMoveTo = useCallback((left: number, top: number, dur = 500) => {
    return new Promise<void>(res => {
      const el = ghostRef.current;
      if (!el) { res(); return; }
      el.style.display = 'block';
      el.style.transition = `left ${dur}ms cubic-bezier(.4,0,.2,1), top ${dur}ms cubic-bezier(.4,0,.2,1)`;
      el.style.left = `${left}px`;
      el.style.top  = `${top}px`;
      setTimeout(res, dur + 40);
    });
  }, []);

  const ghostClick = useCallback(() => {
    return new Promise<void>(res => {
      const rp = rippleRef.current;
      if (!rp) { res(); return; }
      rp.className = 'tour-ripple tour-ripple-go';
      setTimeout(() => { rp.className = 'tour-ripple'; res(); }, 450);
    });
  }, []);

  // ── Finish / Skip ─────────────────────────────────────────────────────────

  const finishTour = useCallback(() => {
    seqVersion.current++;
    disableSpotlight();
    cancelAnimationFrame(morphRAF.current);
    cancelAnimationFrame(fadeRAF.current);
    setShowModal(false);
    setShowFill(false);
    setShowPresDD(false);
    setShowCtx(false);
    if (ghostRef.current) ghostRef.current.style.display = 'none';
    fadeOverlay(
      parseFloat(spRectRef.current?.getAttribute('opacity') ?? '0'),
      0, 250,
      () => { completeTour(); },
    );
  }, [disableSpotlight, fadeOverlay, completeTour]);

  // ── Tour state machine ────────────────────────────────────────────────────

  // STATE: WELCOME — open the queue immediately so the empty dashboard shows behind the card
  useEffect(() => {
    if (tourState !== 'WELCOME') return;
    onOpenQueue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: SPOTLIGHT_ADD
  useEffect(() => {
    if (tourState !== 'SPOTLIGHT_ADD') return;
    const timer = setTimeout(() => {
      const el = addBtnRef.current;
      if (!el) return;
      showSpotlightOn(el, 5, 10, {
        title: t('tour.step_add_title'),
        desc:  t('tour.step_add_desc'),
        nudge: t('tour.step_add_nudge'),
        arrow: 'up', step: 1,
      });
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: MODAL_GHOST
  useEffect(() => {
    if (tourState !== 'MODAL_GHOST') return;
    const ver = ++seqVersion.current;
    const run = async () => {
      disableSpotlight();
      await delay(200);
      if (seqVersion.current !== ver) return;

      setShowModal(true);
      await delay(500);
      if (seqVersion.current !== ver) return;

      const container = getContainer();
      if (!container) return;
      const sr = container.getBoundingClientRect();

      // Position ghost at add-btn location
      const ab = addBtnRef.current?.getBoundingClientRect();
      if (!ab) return;
      if (ghostRef.current) {
        ghostRef.current.style.transition = 'none';
        ghostRef.current.style.left = `${ab.left - sr.left + 8}px`;
        ghostRef.current.style.top  = `${ab.top  - sr.top  + 8}px`;
      }
      await delay(150);
      if (seqVersion.current !== ver) return;

      // Move to name field
      const ni = fakeNameInputRef.current?.getBoundingClientRect();
      if (!ni) return;
      await ghostMoveTo(ni.left - sr.left + 60, ni.top - sr.top + 12, 550);
      if (seqVersion.current !== ver) return;
      setModalNameFocused(true);
      await ghostClick();

      // Type name character by character
      const nameStr = 'Mohamed';
      for (let i = 0; i < nameStr.length; i++) {
        if (seqVersion.current !== ver) return;
        setModalName(nameStr.slice(0, i + 1));
        await delay(100);
      }
      await delay(300);
      if (seqVersion.current !== ver) return;

      // Move to phone field
      const pi = fakePhoneInputRef.current?.getBoundingClientRect();
      if (!pi) return;
      await ghostMoveTo(pi.left - sr.left + 60, pi.top - sr.top + 12, 500);
      if (seqVersion.current !== ver) return;
      setModalNameFocused(false);
      setModalPhoneFocused(true);
      await ghostClick();

      // Type phone
      const phoneStr = '55 123 456';
      let digitCount = 0;
      for (let i = 0; i < phoneStr.length; i++) {
        if (seqVersion.current !== ver) return;
        setModalPhone(phoneStr.slice(0, i + 1));
        if (phoneStr[i] !== ' ') {
          digitCount++;
          setPhoneCursor(Math.min(digitCount, 8));
        }
        await delay(95);
      }
      await delay(400);
      if (seqVersion.current !== ver) return;

      // Move to add button
      const ab2 = fakeAddBtnRef.current?.getBoundingClientRect();
      if (!ab2) return;
      await ghostMoveTo(ab2.left - sr.left + ab2.width / 2, ab2.top - sr.top + 10, 500);
      if (seqVersion.current !== ver) return;
      await ghostClick();

      // Button press visual
      setModalBtnPress(true);
      await delay(200);
      if (seqVersion.current !== ver) return;
      setModalBtnPress(false);

      // Close modal
      setShowModal(false);
      setModalNameFocused(false);
      setModalPhoneFocused(false);
      if (ghostRef.current) ghostRef.current.style.display = 'none';

      // Add Mohamed to demo queue with animation
      await delay(500);
      if (seqVersion.current !== ver) return;
      setDemoPatients([{ name: 'Mohamed', wait: '0 min', visible: false }]);
      await delay(60);
      setDemoPatients([{ name: 'Mohamed', wait: '0 min', visible: true }]);
      setQueueRevealPhase(true); // let the queue show during this pause

      await delay(4500); // let user watch Mohamed in the queue
      if (seqVersion.current !== ver) return;
      setState('FILLING');
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: FILLING
  useEffect(() => {
    if (tourState !== 'FILLING') return;
    const ver = seqVersion.current;
    const t0 = setTimeout(() => setShowFill(true), 1800);
    const t1 = setTimeout(() => setFillGo(true), 2000);
    const t2 = setTimeout(async () => {
      if (seqVersion.current !== ver) return;
      setShowFill(false);
      setFillGo(false);

      await delay(400);
      if (seqVersion.current !== ver) return;

      // Add Lilia, Fadi, Ali, Olfa with staggered animation
      const toAdd = ALL_PATIENTS.slice(1);
      for (const p of toAdd) {
        if (seqVersion.current !== ver) return;
        setDemoPatients(prev => [...prev, { ...p, visible: false }]);
        await delay(80);
        setDemoPatients(prev =>
          prev.map(dp => dp.name === p.name ? { ...dp, visible: true } : dp)
        );
        await delay(450);
      }

      await delay(600);
      if (seqVersion.current !== ver) return;
      setState('SPOTLIGHT_PRESENCE');
    }, 3000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: SPOTLIGHT_PRESENCE
  useEffect(() => {
    if (tourState !== 'SPOTLIGHT_PRESENCE') return;
    const timer = setTimeout(() => {
      const el = presencePillRef.current;
      if (!el) return;
      showSpotlightOn(el, 5, 14, {
        title: t('tour.step_presence_title'),
        desc:  t('tour.step_presence_desc'),
        nudge: t('tour.step_presence_nudge'),
        arrow: 'up', step: 2,
      }, 'up');
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: DEMO_PRESENCE
  useEffect(() => {
    if (tourState !== 'DEMO_PRESENCE') return;
    const ver = seqVersion.current;
    const run = async () => {
      disableSpotlight();

      // Show fake presence dropdown
      setShowPresDD(true);
      await delay(700);
      if (seqVersion.current !== ver) return;

      setPresentSelected(true);
      await delay(900);
      if (seqVersion.current !== ver) return;

      setShowPresDD(false);

      // Move Mohamed to consultation
      await delay(500);
      if (seqVersion.current !== ver) return;
      setConsultingName('Mohamed');
      setDemoPatients(prev => prev.filter(p => p.name !== 'Mohamed'));

      await delay(1400);
      if (seqVersion.current !== ver) return;
      setState('SPOTLIGHT_SHARE');
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: SPOTLIGHT_SHARE
  useEffect(() => {
    if (tourState !== 'SPOTLIGHT_SHARE') return;
    const timer = setTimeout(() => {
      const el = lastKebabRef.current;
      if (!el) return;
      showSpotlightOn(el, 5, 8, {
        title: t('tour.step_share_title'),
        desc:  t('tour.step_share_desc'),
        nudge: t('tour.step_share_nudge'),
        arrow: 'up', step: 3,
      }, 'up');
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // STATE: CTX_MENU — open fake ctx menu, then spotlight WhatsApp item
  useEffect(() => {
    if (tourState !== 'CTX_MENU') return;
    const ver = seqVersion.current;
    const lastPatient = demoPatients[demoPatients.length - 1]; // Olfa — last in queue
    if (!lastPatient) return;

    disableSpotlight();
    setCtxPatient({
      name: lastPatient.name,
      sub:  `Position #${demoPatients.length} · ${lastPatient.wait} d'attente`,
    });
    setShowCtx(true);

    const timer = setTimeout(() => {
      if (seqVersion.current !== ver) return;
      const el = whatsappItemRef.current;
      if (!el) return;
      // WhatsApp row is BELOW the fade-in menu, tooltip goes ABOVE
      showSpotlightOn(el, 4, 10, {
        title: t('tour.step_whatsapp_title'),
        desc:  t('tour.step_whatsapp_desc'),
        arrow: 'down', step: 4,
        showFinish: true,
      }, 'down');
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourState]);

  // ── Derived display flags ────────────────────────────────────────────────

  const showDemoQueue = demoPatients.length > 0 &&
    tourState !== 'IDLE' && tourState !== 'WELCOME' &&
    (tourState !== 'MODAL_GHOST' || queueRevealPhase);

  const showConsult = consultingName !== null &&
    (tourState === 'SPOTLIGHT_SHARE' || tourState === 'CTX_MENU' ||
     tourState === 'DEMO_PRESENCE' || tourState === 'SPOTLIGHT_PRESENCE' ||
     tourState === 'DONE');

  // ── Queue position helpers ────────────────────────────────────────────────

  const getQueueTop = useCallback((): number => {
    const container = getContainer();
    const addBtn = addBtnRef.current;
    if (!container || !addBtn) return 160;
    const cr = container.getBoundingClientRect();
    const ar = addBtn.getBoundingClientRect();
    // Below QuickAddBar row + SectionHeader (~30px)
    return ar.bottom - cr.top + 30;
  }, [getContainer, addBtnRef]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (tourState === 'IDLE') return null;

  return (
    <>
      {/* Inline styles for animations that can't be in Tailwind */}
      <style>{`
        .tour-border-on { opacity: 1 !important; }
        .tour-border-breathe {
          animation: tour-breathe 2.2s ease-in-out infinite;
        }
        @keyframes tour-breathe {
          0%,100% { box-shadow: 0 0 0 3px rgba(15,123,108,.10), 0 0 16px rgba(15,123,108,.50), 0 0 36px rgba(15,123,108,.18); }
          50%      { box-shadow: 0 0 0 5px rgba(15,123,108,.20), 0 0 28px rgba(15,123,108,.78), 0 0 56px rgba(15,123,108,.28); }
        }
        .tour-tip-in  { animation: tour-tip-in  .5s cubic-bezier(.34,1.56,.64,1) forwards; }
        .tour-tip-out { animation: tour-tip-out .22s ease forwards; }
        @keyframes tour-tip-in  { from { opacity:0; transform:translateY(12px) scale(.93); filter:blur(4px); } to { opacity:1; transform:none; filter:none; } }
        @keyframes tour-tip-out { from { opacity:1; transform:none; filter:none; } to { opacity:0; transform:translateY(-8px) scale(.96); filter:blur(3px); } }
        .tour-ripple { position: absolute; inset: -5px; border-radius: 50%; border: 2px solid rgba(15,123,108,.7); opacity: 0; }
        .tour-ripple-go { animation: tour-cr .4s ease forwards; }
        @keyframes tour-cr { 0% { opacity:.9; transform:scale(1); } 100% { opacity:0; transform:scale(2.6); } }
        .tour-qi-enter { animation: tour-qi-in .35s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes tour-qi-in { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
        .tour-ctx-enter { animation: tour-ctx-in .38s cubic-bezier(.4,0,.2,1) forwards; }
        @keyframes tour-ctx-in { from { transform:translateY(100%); } to { transform:translateY(0); } }
        .tour-dd-enter { animation: tour-dd-in .22s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes tour-dd-in { from { opacity:0; transform:scale(.9) translateY(-6px); } to { opacity:1; transform:none; } }
        .tour-done-in { animation: tour-done-ani .4s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes tour-done-ani { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:none; } }
      `}</style>

      {/* ── Overlay root: pointer-events none, children opt in ── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none',
          zIndex: 100,
          fontFamily: "'DM Sans', 'IBM Plex Sans Arabic', sans-serif",
        }}
      >

        {/* ── Fake content panel: single opaque block covers real UI below QuickAddBar ── */}
        {(showConsult || showDemoQueue) && (
          <div style={{
            position: 'absolute',
            top: getQueueTop() - 30,
            left: 0, right: 0, bottom: 0,
            backgroundColor: '#F6F5F0',
            zIndex: 10,
            overflow: 'hidden',
          }}>

            {/* EN CONSULTATION section header + card */}
            {showConsult && consultingName && (
              <>
                {/* Section header — matches SectionHeader.tsx: px-5 pt-[18px] pb-2 */}
                <div style={{
                  padding: '18px 20px 8px',
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#9E9B90',
                }}>
                  {t('receptionist.sections.inConsultation')}
                </div>
                {/* Patient card — matches CurrentPatientCard.tsx */}
                <div style={{
                  margin: '0 20px',
                  backgroundColor: '#0F7B6C',
                  borderRadius: 14, padding: '16px',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>
                    {t('receptionist.currentPatient.label')}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{consultingName}</div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                    {t('receptionist.currentPatient.meta', {
                      arrivedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                      minutes: 0,
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button style={{
                      height: 36, padding: '0 14px', borderRadius: 999,
                      fontSize: 13, fontWeight: 600,
                      backgroundColor: '#fff', color: '#0F7B6C',
                      border: '1.5px solid #fff', display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'default',
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {t('receptionist.currentPatient.finish')}
                    </button>
                    <button style={{
                      height: 36, padding: '0 14px', borderRadius: 999,
                      fontSize: 13, fontWeight: 600,
                      backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
                      border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center',
                      cursor: 'default',
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>phone</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* FILE D'ATTENTE section header + queue rows */}
            {showDemoQueue && (
              <>
                {/* Section header — matches SectionHeader.tsx */}
                <div style={{
                  padding: '18px 20px 8px',
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: '#9E9B90',
                }}>
                  {t('receptionist.sections.waitingList')}
                </div>
                {/* Queue items */}
                <div style={{ padding: '0 20px' }}>
                  {demoPatients.map((p, i) => (
                    <div
                      key={p.name}
                      className={p.visible ? 'tour-qi-enter' : ''}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0',
                        borderBottom: i < demoPatients.length - 1 ? '1px solid #E8E6DF' : 'none',
                        opacity: p.visible ? 1 : 0,
                      }}
                    >
                      {/* Position */}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: i === 0 ? '#E8F5F1' : '#F0EFEA',
                        color: i === 0 ? '#0F7B6C' : '#6B6960',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#9E9B90', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2D8B4E', display: 'inline-block' }} />
                          {p.wait}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4, pointerEvents: 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9B90' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>phone</span>
                        </div>
                        {/* Kebab — only first row is tappable during SPOTLIGHT_SHARE */}
                        <button
                          ref={i === 0 ? firstKebabRef : i === 3 ? lastKebabRef : undefined}
                          onClick={() => {
                            useTourStore.getState().onKebabClick(i);
                          }}
                          style={{
                            width: 36, height: 36, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#9E9B90', background: 'none', border: 'none',
                            cursor: 'pointer',
                            pointerEvents: (tourState === 'SPOTLIGHT_SHARE' && i === 3) ? 'auto' : 'none',
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>more_vert</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Fake context menu (must be BELOW the SVG spotlight so the mask punch-hole reveals WhatsApp row) ── */}
        {showCtx && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
            <div className="tour-ctx-enter" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 32px rgba(0,0,0,.12)',
            }}>
              <div style={{ width: 36, height: 4, background: '#E8E6DF', borderRadius: 2, margin: '12px auto' }} />
              <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #E8E6DF' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{ctxPatient.name}</div>
                <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 2 }}>{ctxPatient.sub}</div>
              </div>
              {/* Urgence */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F5F4F0' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FDF0ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#D94F3B' }}>emergency</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>Urgence</div>
                  <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>Passe en priorité absolue</div>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9E9B90' }}>chevron_right</span>
              </div>
              {/* Copy URL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F5F4F0' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDF3FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#3B7DD9' }}>link</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>Copier URL</div>
                  <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>Lien de suivi de la position</div>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9E9B90' }}>chevron_right</span>
              </div>
              {/* WhatsApp — spotlight target, real link */}
              <button
                ref={whatsappItemRef}
                type="button"
                onClick={() => {
                  const statusUrl = `${window.location.origin}/patient/tour-demo`;
                  const text = encodeURIComponent(`Voici le lien pour suivre votre position en file d'attente : ${statusUrl}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '1px solid #F5F4F0',
                  width: '100%', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8F7EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.523 5.857L.057 23.882a.5.5 0 0 0 .613.613l6.101-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.52-5.16-1.426l-.37-.22-3.827.916.933-3.74-.242-.386A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>Envoyer via WhatsApp</div>
                  <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>Partager le lien de suivi</div>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9E9B90' }}>chevron_right</span>
              </button>
              {/* Remove */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FDF0ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#D94F3B' }}>person_remove</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>Retirer de la file</div>
                  <div style={{ fontSize: 12, color: '#9E9B90', marginTop: 1 }}>Supprimer définitivement</div>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9E9B90' }}>chevron_right</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SVG Spotlight (Bug 1: pointer-events none on SVG AND rect) ── */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            display: 'block',
            pointerEvents: 'none',  // Bug 1
            zIndex: 20,
          }}
        >
          <defs>
            <mask id="tour-sp-mask">
              <rect width={SVG_W} height={SVG_H} fill="white" />
              <rect
                ref={spHoleRef}
                x={FULL_HOLE.x} y={FULL_HOLE.y}
                width={FULL_HOLE.w} height={FULL_HOLE.h}
                rx={FULL_HOLE.rx}
                fill="black"
                style={{ pointerEvents: 'none' }}  // Bug 1
              />
            </mask>
          </defs>
          <rect
            ref={spRectRef}
            width={SVG_W} height={SVG_H}
            fill="rgba(26,26,24,0.88)"
            mask="url(#tour-sp-mask)"
            opacity="0"
            style={{ pointerEvents: 'none' }}  // Bug 1
          />
        </svg>

        {/* ── Glow border ─────────────────────────────────────── */}
        <div
          ref={spBorderRef}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 22,
            border: '2px solid #0F7B6C',
            opacity: 0,
            boxShadow: '0 0 0 4px rgba(15,123,108,.12), 0 0 20px rgba(15,123,108,.55), 0 0 44px rgba(15,123,108,.2)',
            transition: 'opacity .25s',
          }}
        />

        {/* ── Tooltip (light mode) ──────────────────────────── */}
        {tooltipCfg && (
          <div
            ref={tooltipRef}
            className="tour-tip-in"
            style={{
              position: 'absolute',
              left: 16,
              top: tooltipTop,
              width: 'calc(100% - 32px)',
              maxWidth: 280,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: '15px 17px',
              zIndex: 23,
              border: '1px solid #E8E6DF',
              boxShadow: '0 8px 32px rgba(0,0,0,.10)',
              pointerEvents: tooltipPE ? 'auto' : 'none',
            }}
          >
            {/* Arrow */}
            {tooltipCfg.arrow === 'up' && (
              <div style={{
                position: 'absolute', bottom: '100%', left: tooltipArrowLeft,
                borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                borderBottom: '7px solid #E8E6DF',
                width: 0, height: 0,
              }}>
                <div style={{
                  position: 'absolute', top: 1, left: -7,
                  borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                  borderBottom: '7px solid #fff',
                  width: 0, height: 0,
                }} />
              </div>
            )}
            {tooltipCfg.arrow === 'down' && (
              <div style={{
                position: 'absolute', top: '100%', left: tooltipArrowLeft,
                borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                borderTop: '7px solid #E8E6DF',
                width: 0, height: 0,
              }}>
                <div style={{
                  position: 'absolute', bottom: 1, left: -7,
                  borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                  borderTop: '7px solid #fff',
                  width: 0, height: 0,
                }} />
              </div>
            )}

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F7B6C' }}>
                {t('tour.step_label', { step: tooltipCfg.step, total: 4 })}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    height: 5,
                    width: i <= tooltipCfg.step ? 13 : 5,
                    borderRadius: i <= tooltipCfg.step ? 3 : '50%',
                    background: i <= tooltipCfg.step ? '#0F7B6C' : '#E8E6DF',
                    transition: 'all .25s',
                  }} />
                ))}
              </div>
            </div>

            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1A1A', marginBottom: 6, lineHeight: 1.3 }}>
              {tooltipCfg.title}
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.58, color: '#6B6960', marginBottom: 14 }}>
              {tooltipCfg.desc}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={finishTour}
                style={{ fontSize: 11, color: '#9E9B90', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('tour.skip')}
              </button>
              {tooltipCfg.nudge ? (
                <div style={{
                  background: '#E8F5F1', border: '1px solid #A8D5C8',
                  borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#0A5C50',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 14, color: '#0A5C50', display: 'inline-block', animation: 'tour-nudge .9s ease-in-out infinite', fontVariationSettings: "'FILL' 1" }}
                  >touch_app</span>
                  {tooltipCfg.nudge}
                </div>
              ) : tooltipCfg.showFinish ? (
                <button
                  onClick={finishTour}
                  style={{
                    background: '#0F7B6C', color: '#fff', border: 'none',
                    padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    boxShadow: '0 4px 12px rgba(15,123,108,.25)',
                  }}
                >
                  {t('tour.finish')} →
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Ghost cursor ─────────────────────────────────────── */}
        <div
          ref={ghostRef}
          style={{
            position: 'absolute', zIndex: 70,
            width: 22, height: 22,
            pointerEvents: 'none',
            display: 'none',
          }}
        >
          <svg viewBox="0 0 18 22" fill="none" width={22} height={22}
            style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.5))' }}>
            <path d="M2 2l12 7-6 1.5L5.5 17 2 2z" fill="white" stroke="#1B2D25" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <div ref={rippleRef} className="tour-ripple" />
        </div>

        {/* ── Fake presence dropdown ───────────────────────────── */}
        {showPresDD && (
          <div
            className="tour-dd-enter"
            style={{
              position: 'absolute',
              top: 40, right: 12,
              width: 160,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 28px rgba(0,0,0,.18), 0 0 0 1px #E8E6DF',
              zIndex: 60,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', fontSize: 13, fontWeight: presentSelected ? 600 : 400,
              color: '#2D8B4E',
              background: presentSelected ? '#EDF7F0' : 'transparent',
              borderBottom: '1px solid #E8E6DF',
            }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2D8B4E', flexShrink: 0 }} />
              Présent
              {presentSelected && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', fontSize: 13, fontWeight: !presentSelected ? 600 : 400,
              color: '#D94F3B',
              background: !presentSelected ? '#FDF0ED' : 'transparent',
            }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#D94F3B', flexShrink: 0 }} />
              Absent
              {!presentSelected && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
            </div>
          </div>
        )}

        {/* ── Fake add-patient modal ───────────────────────────── */}
        {showModal && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 60,
            pointerEvents: 'auto',
          }}>
            {/* Backdrop */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,20,14,.55)' }} />
            {/* Sheet */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '20px 20px 0 0',
              paddingBottom: 16,
              boxShadow: '0 -4px 32px rgba(0,0,0,.12)',
              animation: 'tour-ctx-in .4s cubic-bezier(.4,0,.2,1)',
            }}>
              <div style={{ width: 36, height: 4, background: '#E8E6DF', borderRadius: 2, margin: '12px auto 14px' }} />
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', padding: '0 16px 14px' }}>Nouveau patient</div>

              {/* Name field */}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6960', padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                Nom du patient
              </div>
              <div
                ref={fakeNameInputRef}
                style={{
                  margin: '0 12px 12px',
                  background: modalNameFocused ? '#fff' : '#F0EFEA',
                  border: `1.5px solid ${modalNameFocused ? '#0F7B6C' : '#E8E6DF'}`,
                  borderRadius: 10, height: 40,
                  padding: '0 36px 0 12px',
                  display: 'flex', alignItems: 'center',
                  boxShadow: modalNameFocused ? '0 0 0 3px rgba(15,123,108,.1)' : 'none',
                  transition: 'border-color .2s, box-shadow .2s',
                }}
              >
                {modalName ? (
                  <span style={{ fontSize: 12, color: '#1A1A1A' }}>{modalName}</span>
                ) : (
                  <span style={{ fontSize: 12, color: '#9E9B90' }}>Prénom et nom…</span>
                )}
              </div>

              {/* Phone field */}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6960', padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                Numéro de téléphone
                <span style={{ opacity: .6, fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
              </div>
              <div style={{ display: 'flex', gap: 6, margin: '0 12px 4px' }}>
                <div style={{ width: 52, height: 40, background: '#F0EFEA', border: '1.5px solid #E8E6DF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#1A1A1A', flexShrink: 0 }}>+216</div>
                <div
                  ref={fakePhoneInputRef}
                  style={{
                    flex: 1, height: 40,
                    background: modalPhoneFocused ? '#fff' : '#F0EFEA',
                    border: `1.5px solid ${modalPhoneFocused ? '#0F7B6C' : '#E8E6DF'}`,
                    borderRadius: 10, padding: '0 36px 0 12px',
                    display: 'flex', alignItems: 'center', position: 'relative',
                    boxShadow: modalPhoneFocused ? '0 0 0 3px rgba(15,123,108,.1)' : 'none',
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                >
                  {modalPhone ? (
                    <span style={{ fontSize: 12, color: '#1A1A1A', flex: 1 }}>{modalPhone}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9E9B90', flex: 1 }}>XX XXX XXX</span>
                  )}
                  <span style={{ position: 'absolute', right: 10, fontSize: 9, color: '#9E9B90' }}>{phoneCursor} / 8</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#9E9B90', padding: '0 12px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                ℹ️ 8 chiffres après +216, ex : 55 123 456
              </div>

              {/* Submit button */}
              <div
                ref={fakeAddBtnRef}
                style={{
                  margin: '4px 12px 0',
                  background: '#0F7B6C', borderRadius: 12, height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 600, gap: 8,
                  cursor: 'pointer', userSelect: 'none',
                  boxShadow: '0 4px 12px rgba(15,123,108,.25)',
                  transform: modalBtnPress ? 'scale(.97)' : 'none',
                  transition: 'transform .12s',
                }}
              >
                → Ajouter à la file
              </div>
            </div>
          </div>
        )}

        {/* ── Fill overlay ─────────────────────────────────────── */}
        {showFill && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(26,26,24,0.60)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            pointerEvents: 'none',
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: 20, padding: '22px 20px', textAlign: 'center',
              border: '1px solid #E8E6DF',
              boxShadow: '0 8px 32px rgba(0,0,0,.10)',
              width: '100%',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#E8F5F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#0F7B6C', fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
              </div>
              <h4 style={{ fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
                {t('tour.fill_title')}
              </h4>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#6B6960', margin: 0 }}>
                {t('tour.fill_body')}
              </p>
              <div style={{ marginTop: 16, height: 3, background: '#E8E6DF', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: '#0F7B6C', borderRadius: 2,
                  width: fillGo ? '100%' : '0%',
                  transition: 'width 2.4s linear',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Welcome overlay ──────────────────────────────────── */}
        {tourState === 'WELCOME' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 150,
            background: 'rgba(26,26,24,0.60)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            pointerEvents: 'auto',
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: 20, padding: '24px 22px',
              border: '1px solid #E8E6DF',
              boxShadow: '0 8px 32px rgba(0,0,0,.10)',
              textAlign: 'center',
              animation: 'tour-done-ani .4s cubic-bezier(.34,1.56,.64,1)',
              width: '100%',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0F7B6C, #2D8B4E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, margin: '0 auto 14px',
                boxShadow: '0 8px 24px rgba(15,123,108,.3)',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#fff', fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
              </div>
              <h3 style={{ fontFamily: 'inherit', fontSize: 17, fontWeight: 800, color: '#1A1A1A', marginBottom: 9, lineHeight: 1.2 }}>
                {t('tour.welcome_title')}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#6B6960', marginBottom: 20 }}>
                {t('tour.welcome_body')}
              </p>
              <button
                onClick={() => setState('SPOTLIGHT_ADD')}
                style={{
                  background: '#0F7B6C', color: '#fff', border: 'none',
                  padding: '12px 20px', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                  cursor: 'pointer', width: '100%',
                  boxShadow: '0 4px 12px rgba(15,123,108,.25)',
                }}
              >
                {t('tour.welcome_cta')} →
              </button>
              <button
                onClick={finishTour}
                style={{ marginTop: 12, fontSize: 12, color: '#9E9B90', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('tour.skip')}
              </button>
            </div>
          </div>
        )}


        {/* ── Done screen ──────────────────────────────────────── */}
      </div>

      {/* Nudge bob animation (can't be in Tailwind) */}
      <style>{`
        @keyframes tour-nudge { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
      `}</style>
    </>
  );
}
