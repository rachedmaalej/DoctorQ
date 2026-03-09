import ASIcon from './ASIcon';
import { useState } from 'react';


interface ASDoctolibImportBannerProps {
  onImportDoctolib: () => void;
  onManualEntry: () => void;
  onDismiss: () => void;
}

function getTodayKey(): string {
  return `as-schedule-dismissed-${new Date().toISOString().slice(0, 10)}`;
}

export function isDoctolibBannerDismissed(): boolean {
  return localStorage.getItem(getTodayKey()) === '1';
}

export default function ASDoctolibImportBanner({
  onImportDoctolib,
  onManualEntry,
  onDismiss,
}: ASDoctolibImportBannerProps) {
  const [dismissed, setDismissed] = useState(() => isDoctolibBannerDismissed());

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(getTodayKey(), '1');
    setDismissed(true);
    onDismiss();
  };

  return (
    <div style={{ padding: '0 18px', marginBottom: 8 }}>
      <div
        className="as-fade-up"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ASIcon name="close" size={14} />
        </button>

        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <ASIcon name="calendar_today" size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Agenda du jour
          </span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
          Aucun cr&eacute;neau configur&eacute; pour aujourd&apos;hui. Comment souhaitez-vous proc&eacute;der ?
        </p>

        <div className="flex flex-col gap-2">
          {/* Option A: Import from Doctolib */}
          <button
            onClick={onImportDoctolib}
            className="flex items-center gap-2.5"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-primary)',
              background: 'var(--color-primary-light)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'left',
            }}
          >
            <ASIcon name="upload" size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div>
              <div>Importer depuis Doctolib</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)', marginTop: 1 }}>
                Synchroniser les rendez-vous du jour
              </div>
            </div>
          </button>

          {/* Option B: Manual entry */}
          <button
            onClick={onManualEntry}
            className="flex items-center gap-2.5"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'left',
            }}
          >
            <ASIcon name="edit" size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            <div>
              <div>Saisir les cr&eacute;neaux du jour</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)', marginTop: 1 }}>
                Entrer manuellement les rendez-vous
              </div>
            </div>
          </button>

          {/* Option C: Continue without schedule */}
          <button
            onClick={handleDismiss}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            Continuer sans agenda
          </button>
        </div>
      </div>
    </div>
  );
}
