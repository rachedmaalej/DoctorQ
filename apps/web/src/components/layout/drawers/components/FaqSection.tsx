import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { FAQ_ITEMS, FAQ_CLUSTERS } from '@/data/helpSupport';
import type { Lang } from '../HelpSupportDrawer.types';

const WHATSAPP_NUMBER = '21600000000';

interface FaqSectionProps {
  onFaqSelect?: (faqId: string) => void;
}

export function FaqSection({ onFaqSelect }: FaqSectionProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const lang = i18n.language as Lang;
  const isRtl = lang === 'ar';

  // Collapse all when search query changes
  useEffect(() => {
    setOpenIds(new Set());
  }, [query]);

  const toggleFaq = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onFaqSelect?.(id);
  };

  // Filter on question + answer text
  const filteredFaqs = useMemo(() => {
    if (query.trim() === '') return FAQ_ITEMS;
    const q = query.toLowerCase();
    return FAQ_ITEMS.filter(item =>
      item.question[lang].toLowerCase().includes(q) ||
      item.answer[lang].toLowerCase().includes(q)
    );
  }, [query, lang]);

  // Group filtered items by cluster (preserving cluster order)
  const groupedFaqs = useMemo(() => {
    return FAQ_CLUSTERS
      .map(cluster => ({
        cluster,
        items: filteredFaqs.filter(faq => faq.cluster === cluster.id),
      }))
      .filter(group => group.items.length > 0);
  }, [filteredFaqs]);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(t('helpSupport.support.whatsappMessage'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
  };

  return (
    <div>
      {/* Search input */}
      <div style={{ margin: '12px 12px 4px', position: 'relative' }}>
        <Icon
          name="search"
          size={16}
          style={{
            position: 'absolute',
            left: isRtl ? 'auto' : 9,
            right: isRtl ? 9 : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9E9B90',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('helpSupport.faq.searchPlaceholder')}
          aria-label={t('helpSupport.faq.searchPlaceholder')}
          className="help-drawer-search"
          style={{
            width: '100%',
            height: 36,
            background: '#F6F5F0',
            border: '1.5px solid #E8E6DF',
            borderRadius: 9,
            padding: isRtl ? '0 34px 0 12px' : '0 12px 0 34px',
            fontSize: 12,
            fontWeight: 400,
            color: '#1A1A1A',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Grouped FAQ list */}
      {groupedFaqs.length > 0 ? (
        groupedFaqs.map((group, gi) => (
          <div key={group.cluster.id}>
            {/* Cluster header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: gi === 0 ? '10px 16px 4px' : '14px 16px 4px',
              }}
            >
              <Icon name={group.cluster.icon} size={12} style={{ color: '#8E9693' }} />
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: '#8E9693',
              }}>
                {group.cluster.label[lang]}
              </span>
            </div>

            {/* FAQ rows */}
            {group.items.map((faq, i) => {
              const isOpen = openIds.has(faq.id);
              return (
                <div key={faq.id}>
                  {/* Question row */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleFaq(faq.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFaq(faq.id); } }}
                    className="help-drawer-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 16px',
                      borderBottom: (isOpen || i < group.items.length - 1) ? '1px solid #F0EFEA' : 'none',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Question text */}
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#1A1A1A',
                      lineHeight: 1.4,
                    }}>
                      {faq.question[lang]}
                    </span>

                    {/* Chevron */}
                    <Icon
                      name={isRtl ? 'chevron_left' : 'chevron_right'}
                      size={16}
                      className={`help-faq-chevron ${isOpen ? 'is-open' : ''}`}
                      style={{ color: '#C5C3BC', flexShrink: 0 }}
                    />
                  </div>

                  {/* Answer panel */}
                  <div
                    className={`help-faq-answer ${isOpen ? 'is-open' : ''}`}
                    style={{ background: '#F9F8F5' }}
                  >
                    <div style={{
                      fontSize: 12,
                      fontWeight: 400,
                      color: '#4A5250',
                      lineHeight: 1.55,
                    }}>
                      {faq.answer[lang]}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Separator between clusters (not after last) */}
            {gi < groupedFaqs.length - 1 && (
              <div style={{ height: 1, background: '#EEEDEA', margin: '0' }} />
            )}
          </div>
        ))
      ) : (
        /* Empty state */
        <div style={{
          padding: '28px 16px',
          textAlign: 'center',
        }}>
          <Icon name="search_off" size={28} style={{ color: '#C5C3BC', marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6B6960', marginBottom: 4 }}>
            {t('helpSupport.faq.noResults')}
          </div>
          <div style={{ fontSize: 11, color: '#9E9B90', marginBottom: 14 }}>
            {t('helpSupport.faq.noResultsSub')}
          </div>
          <button
            onClick={handleWhatsApp}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: '#0F7B6C',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Icon name="chat" size={14} style={{ color: '#FFFFFF' }} />
            {t('helpSupport.faq.contactSupport')}
          </button>
        </div>
      )}
    </div>
  );
}
