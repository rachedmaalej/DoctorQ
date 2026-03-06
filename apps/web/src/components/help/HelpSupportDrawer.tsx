import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';
import { useHelpSearch } from '@/hooks/useHelpSearch';
import type { FaqItem } from '@/hooks/useHelpSearch';
import helpData from '@/i18n/help-support.json';
import '@/components/shared/shared.css';

interface VideoItem {
  title: string;
  duration: string;
  icon: string;
  tag: string;
  pillVariant: 'teal' | 'amber' | 'red';
  arcadeUrl?: string;
}

interface HelpContent {
  headerTitle: string;
  contactLabel: string;
  contactTitle: string;
  contactSub: string;
  whatsappMessage: string;
  faqLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptySub: string;
  videoLabel: string;
  langToggle: string;
  faqs: FaqItem[];
  videos: VideoItem[];
}

interface HelpSupportDrawerProps {
  open: boolean;
  onClose: () => void;
  clinicName: string;
}

const POPULAR_INDEXES = [0, 1, 2];
const WHATSAPP_NUMBER = '21600000000';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const norm = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const textNorm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const idx = textNorm.indexOf(norm);
  if (idx === -1) return text;
  // Map back to original text positions
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.trim().length);
  const after = text.slice(idx + query.trim().length);
  return <>{before}<mark className="bs-help-mark">{match}</mark>{after}</>;
}

export default function HelpSupportDrawer({ open, onClose, clinicName }: HelpSupportDrawerProps) {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openVideo, setOpenVideo] = useState<number | null>(null);
  const [showPopularDetail, setShowPopularDetail] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const content = (lang === 'fr' ? helpData.fr : helpData.ar) as HelpContent;
  const dir = lang === 'fr' ? 'ltr' : 'rtl';
  const isRtl = lang === 'ar';

  const { query, setQuery, results, isSearching } = useHelpSearch(content.faqs);

  // Reset state on language toggle
  const toggleLang = useCallback(() => {
    setLang((l) => (l === 'fr' ? 'ar' : 'fr'));
    setQuery('');
    setOpenFaq(null);
    setOpenVideo(null);
    setShowPopularDetail(null);
  }, [setQuery]);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setOpenFaq(null);
      setOpenVideo(null);
      setShowPopularDetail(null);
    }
  }, [open, setQuery]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Focus trap (simple)
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    drawer.addEventListener('keydown', trap);
    // Focus first element
    first.focus();
    return () => drawer.removeEventListener('keydown', trap);
  }, [open]);

  const handlePopularClick = (idx: number) => {
    setShowPopularDetail(idx);
    setOpenFaq(idx);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(content.whatsappMessage);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
    // TODO: analytics — help_whatsapp_tapped
  };

  const handleFaqToggle = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
    // TODO: analytics — help_faq_opened
  };

  const handleVideoToggle = (idx: number) => {
    setOpenVideo((prev) => (prev === idx ? null : idx));
    // TODO: analytics — help_video_opened
  };

  // Determine which FAQ items to show in accordion mode
  const showAccordion = isSearching || showPopularDetail !== null;
  const accordionItems = isSearching
    ? results
    : showPopularDetail !== null
      ? [content.faqs[showPopularDetail]]
      : [];

  const pillColors: Record<string, { bg: string; color: string }> = {
    teal: { bg: '#E8F5F1', color: '#0F7B6C' },
    amber: { bg: '#FEF7E6', color: '#D4920B' },
    red: { bg: '#FDF0ED', color: '#D94F3B' },
  };

  return createPortal(
    <div
      className={`bs-help-overlay ${open ? 'bs-help-overlay--open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className={`bs-help-drawer ${open ? 'bs-help-drawer--open' : ''}`}
        dir={dir}
        role="dialog"
        aria-modal="true"
        aria-label={content.headerTitle}
      >
        {/* ── Header ── */}
        <div className="bs-help-header">
          <div>
            <div className="bs-help-header-title">{content.headerTitle}</div>
            <div className="bs-help-header-sub">{clinicName}</div>
          </div>

          {/* Language toggle */}
          <button
            className="bs-help-lang-btn"
            onClick={toggleLang}
            style={isRtl ? { left: 56, right: 'auto' } : { right: 56 }}
          >
            {content.langToggle}
          </button>

          {/* Close button */}
          <button
            className="bs-help-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            style={isRtl ? { left: 16, right: 'auto' } : { right: 16 }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="bs-help-body">

          {/* Section 1: Contact support */}
          <div className="bs-help-section-label">{content.contactLabel}</div>

          <button className="bs-help-wa-card" onClick={handleWhatsApp}>
            <div className="bs-help-wa-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.11-1.14l-.29-.174-3.01.79.81-2.95-.19-.3A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
            <div className="bs-help-wa-text">
              <strong>{content.contactTitle}</strong>
              <span>{content.contactSub}</span>
            </div>
            <Icon name="open_in_new" size={16} style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
          </button>

          {/* Section 2: FAQ */}
          <div className="bs-help-section-label">{content.faqLabel}</div>

          {/* Search box */}
          <div className="bs-help-search-wrap">
            <div className="bs-help-search-icon">
              <Icon name="search" size={18} />
            </div>
            <input
              ref={searchRef}
              className="bs-help-search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowPopularDetail(null);
              }}
              placeholder={content.searchPlaceholder}
              aria-label={content.searchPlaceholder}
            />
            {query.length > 0 && (
              <button
                className="bs-help-search-clear"
                onClick={() => {
                  setQuery('');
                  setShowPopularDetail(null);
                  searchRef.current?.focus();
                }}
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </div>

          {/* Popular articles (default state) */}
          {!showAccordion && (
            <div className="bs-help-card">
              {POPULAR_INDEXES.map((fi, i) => {
                const faq = content.faqs[fi];
                if (!faq) return null;
                return (
                  <button
                    key={fi}
                    className="bs-help-popular-row"
                    style={i < POPULAR_INDEXES.length - 1 ? { borderBottom: '1px solid #E8E6DF' } : undefined}
                    onClick={() => handlePopularClick(fi)}
                  >
                    <div className="bs-help-icon-pill bs-help-icon-pill--teal">
                      <Icon name={faq.icon} size={14} />
                    </div>
                    <span className="bs-help-popular-text">{faq.q}</span>
                    <Icon
                      name={isRtl ? 'chevron_left' : 'chevron_right'}
                      size={16}
                      style={{ color: '#9E9B90', flexShrink: 0 }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Accordion results */}
          {showAccordion && accordionItems.length > 0 && (
            <div className="bs-help-card">
              {/* Back to popular link when showing single detail */}
              {showPopularDetail !== null && !isSearching && (
                <button
                  className="bs-help-back-link"
                  onClick={() => {
                    setShowPopularDetail(null);
                    setOpenFaq(null);
                  }}
                >
                  <Icon name={isRtl ? 'arrow_forward' : 'arrow_back'} size={16} />
                  {lang === 'fr' ? 'Retour' : 'رجوع'}
                </button>
              )}
              {accordionItems.map((faq, i) => {
                const globalIdx = content.faqs.indexOf(faq);
                const isOpen = openFaq === globalIdx;
                return (
                  <div
                    key={globalIdx}
                    style={i < accordionItems.length - 1 ? { borderBottom: '1px solid #E8E6DF' } : undefined}
                  >
                    <button
                      className="bs-help-accordion-trigger"
                      onClick={() => handleFaqToggle(globalIdx)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-body-${globalIdx}`}
                    >
                      <div className={`bs-help-icon-pill ${isOpen ? 'bs-help-icon-pill--teal' : 'bs-help-icon-pill--muted'}`}>
                        <Icon name={faq.icon} size={14} />
                      </div>
                      <span className="bs-help-accordion-q">
                        {isSearching ? highlightMatch(faq.q, query) : faq.q}
                      </span>
                      <Icon
                        name="expand_more"
                        size={18}
                        style={{
                          color: '#9E9B90',
                          flexShrink: 0,
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.22s ease',
                        }}
                      />
                    </button>
                    <div
                      id={`faq-body-${globalIdx}`}
                      role="region"
                      className={`bs-help-accordion-body ${isOpen ? 'bs-help-accordion-body--open' : ''}`}
                    >
                      <p>{isSearching ? highlightMatch(faq.a, query) : faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {isSearching && results.length === 0 && (
            <div className="bs-help-empty">
              <div className="bs-help-empty-icon">
                <Icon name="search_off" size={22} />
              </div>
              <div className="bs-help-empty-title">{content.emptyTitle}</div>
              <div className="bs-help-empty-sub">{content.emptySub}</div>
            </div>
          )}

          {/* Section 3: Video tutorials */}
          <div className="bs-help-section-label">{content.videoLabel}</div>

          <div className="bs-help-card">
            {content.videos.map((video, i) => {
              const isExpanded = openVideo === i;
              const hasEmbed = !!video.arcadeUrl;
              const pill = pillColors[video.pillVariant] || pillColors.teal;

              return (
                <div
                  key={i}
                  style={i < content.videos.length - 1 ? { borderBottom: '1px solid #E8E6DF' } : undefined}
                >
                  <button
                    className="bs-help-video-row"
                    onClick={() => hasEmbed ? handleVideoToggle(i) : undefined}
                    style={{ cursor: hasEmbed ? 'pointer' : 'default' }}
                  >
                    {/* Thumbnail */}
                    <div className="bs-help-video-thumb">
                      <Icon name={video.icon} size={16} style={{ color: 'rgba(255,255,255,0.40)' }} />
                      {hasEmbed && (
                        <div className="bs-help-video-play">
                          <Icon
                            name={isExpanded ? 'open_in_full' : 'play_arrow'}
                            size={13}
                            fill
                          />
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="bs-help-video-meta">
                      <div className="bs-help-video-title">{video.title}</div>
                      <div className="bs-help-video-info">
                        <span style={{ color: '#9E9B90', fontSize: 12 }}>{video.duration} min</span>
                        <span
                          className="bs-help-video-pill"
                          style={{ background: pill.bg, color: pill.color }}
                        >
                          {video.tag}
                        </span>
                      </div>
                    </div>

                    {hasEmbed && (
                      <Icon
                        name="expand_more"
                        size={18}
                        style={{
                          color: '#9E9B90',
                          flexShrink: 0,
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.22s ease',
                        }}
                      />
                    )}
                    {!hasEmbed && (
                      <Icon
                        name={isRtl ? 'chevron_left' : 'chevron_right'}
                        size={18}
                        style={{ color: '#9E9B90', flexShrink: 0 }}
                      />
                    )}
                  </button>

                  {/* Arcade embed */}
                  {hasEmbed && (
                    <div className={`bs-help-video-embed ${isExpanded ? 'bs-help-video-embed--open' : ''}`}>
                      {isExpanded && (
                        <div className="bs-help-video-embed-inner">
                          <iframe
                            src={video.arcadeUrl}
                            title={video.title}
                            loading="lazy"
                            allow="clipboard-write"
                            allowFullScreen
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              colorScheme: 'light',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bs-help-footer">
            BleSaf v{import.meta.env.VITE_APP_VERSION ?? '2.0.0'} · © {new Date().getFullYear()} BleSaf SARL
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
