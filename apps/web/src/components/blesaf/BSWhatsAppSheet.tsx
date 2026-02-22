import { useState, useEffect } from 'react';
import type { QueuePatient } from '@/components/receptionist/types';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { webBrand } from '@/lib/brand';

interface BSWhatsAppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  patients: QueuePatient[];
  clinicName: string;
  whatsappSentIds: Set<string>;
  onWhatsAppSent: (id: string) => void;
}

type TabKey = 'patient' | 'generic';

export default function BSWhatsAppSheet({
  isOpen,
  onClose,
  patients,
  clinicName,
  whatsappSentIds,
  onWhatsAppSent,
}: BSWhatsAppSheetProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('patient');
  const [qrData, setQrData] = useState<{ url: string; qrCode: string; clinicName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [genericPhone, setGenericPhone] = useState('');

  // Fetch QR/clinic data when generic tab is first selected
  useEffect(() => {
    if (activeTab === 'generic' && !qrData) {
      api.getQRCode()
        .then(data => setQrData(data))
        .catch(err => logger.error('Failed to fetch QR code for WhatsApp:', err));
    }
  }, [activeTab, qrData]);

  // Reset tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('patient');
      setCopied(false);
      setGenericPhone('');
    }
  }, [isOpen]);

  const handleSendToPatient = (patient: QueuePatient) => {
    const statusUrl = `${window.location.origin}/patient/${patient.id}`;
    const message = `${clinicName} - Suivez votre position dans la file d'attente: ${statusUrl}`;
    const waUrl = `https://wa.me/${patient.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onWhatsAppSent(patient.id);
  };

  const fullGenericPhone = genericPhone.length > 0
    ? `${webBrand.phone.countryCode}${genericPhone}`
    : '';

  const handleGenericSend = () => {
    const phoneParam = fullGenericPhone
      ? `/${fullGenericPhone.replace('+', '')}`
      : '';
    if (!qrData) {
      api.getQRCode()
        .then(data => {
          setQrData(data);
          const message = `${data.clinicName} - Rejoignez la file d'attente: ${data.url}`;
          window.open(`https://wa.me${phoneParam}?text=${encodeURIComponent(message)}`, '_blank');
        })
        .catch(err => logger.error('Failed to fetch QR code for WhatsApp:', err));
    } else {
      const message = `${qrData.clinicName} - Rejoignez la file d'attente: ${qrData.url}`;
      window.open(`https://wa.me${phoneParam}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleGenericPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setGenericPhone(raw.slice(0, webBrand.phone.localDigits));
  };

  const genericPhoneDisplay = genericPhone.length > 0
    ? genericPhone.replace(/(\d{2})(\d{3})?(\d{3})?/, (_: string, a: string, b?: string, c?: string) =>
        [a, b, c].filter(Boolean).join(' ')
      )
    : '';

  const handleCopyLink = async () => {
    if (qrData) {
      try {
        await navigator.clipboard.writeText(qrData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard failed */ }
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`bs-sheet-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={`bs-add-sheet ${isOpen ? 'open' : ''}`}>
        <div className="bs-sheet-handle" />
        <div className="bs-sheet-title">WhatsApp</div>
        <div className="bs-sheet-sub">Envoyer un lien au patient ou partager l'inscription</div>

        {/* Tab switcher */}
        <div className="bs-rdv-toggle">
          <button
            className={`bs-rdv-option ${activeTab === 'patient' ? 'active' : ''}`}
            onClick={() => setActiveTab('patient')}
          >
            <span className="material-symbols-rounded">person</span>
            Envoyer au patient
          </button>
          <button
            className={`bs-rdv-option ${activeTab === 'generic' ? 'active' : ''}`}
            onClick={() => setActiveTab('generic')}
          >
            <span className="material-symbols-rounded">link</span>
            Lien d'inscription
          </button>
        </div>

        {/* Tab 1: Patient list */}
        {activeTab === 'patient' && (
          <div style={{ maxHeight: '50vh', overflowY: 'auto', margin: '0 -20px', padding: '0 20px' }}>
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 48, color: '#E8E6DF', display: 'block', marginBottom: 8 }}
                >
                  group_off
                </span>
                <div style={{ fontSize: 14, color: '#9E9B90' }}>
                  Aucun patient en attente
                </div>
              </div>
            ) : (
              patients.map((patient) => {
                const sent = whatsappSentIds.has(patient.id);
                const disabled = !patient.hasPhone;
                return (
                  <button
                    key={patient.id}
                    onClick={() => !disabled && handleSendToPatient(patient)}
                    disabled={disabled}
                    className="flex items-center gap-3 text-left w-full"
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #E8E6DF',
                      opacity: disabled ? 0.35 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      background: 'transparent',
                      border: 'none',
                      borderBottomWidth: 1,
                      borderBottomStyle: 'solid' as const,
                      borderBottomColor: '#E8E6DF',
                    }}
                  >
                    {/* Position circle */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#F0EFEA',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#6B6960',
                      }}
                    >
                      {patient.position}
                    </div>

                    {/* Name + phone */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate"
                        style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}
                      >
                        {patient.name}
                        {sent && (
                          <span
                            className="material-symbols-rounded"
                            style={{
                              fontSize: 13,
                              color: '#25D366',
                              marginLeft: 4,
                              verticalAlign: 'middle',
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#9E9B90' }}>
                        {disabled ? 'Pas de num\u00e9ro' : patient.phone}
                      </div>
                    </div>

                    {/* Send button */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: disabled ? '#F0EFEA' : sent ? '#E8F8EE' : '#25D366',
                      }}
                    >
                      <span
                        className="material-symbols-rounded"
                        style={{
                          fontSize: 18,
                          color: disabled ? '#9E9B90' : sent ? '#25D366' : '#fff',
                        }}
                      >
                        {sent ? 'check' : 'send'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Generic check-in link */}
        {activeTab === 'generic' && (
          <div>
            <p style={{ fontSize: 14, color: '#6B6960', marginBottom: 16 }}>
              Envoyer le lien d'inscription au patient via WhatsApp
            </p>

            {/* Phone input */}
            <div className="bs-form-group" style={{ marginBottom: 16 }}>
              <div
                className="bs-form-label"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6B6960', marginBottom: 6 }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>phone</span>
                Num\u00e9ro WhatsApp du patient
              </div>
              <div
                className="flex items-center"
                dir="ltr"
                style={{
                  border: '1.5px solid #E8E6DF',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    padding: '10px 10px 10px 14px',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#9E9B90',
                    borderRight: '1px solid #E8E6DF',
                    background: '#F6F5F0',
                  }}
                >
                  {webBrand.phone.countryCode}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder={webBrand.phone.placeholder.replace(webBrand.phone.countryCode + ' ', '')}
                  value={genericPhoneDisplay}
                  onChange={handleGenericPhoneChange}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 15,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: '#1A1A1A',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Pre-composed message preview */}
            <div
              style={{
                borderLeft: '3px solid #E8F5F1',
                padding: '10px 14px',
                margin: '0 0 16px',
                fontSize: 13,
                color: '#6B6960',
                fontStyle: 'italic',
                background: '#FFFFFF',
                borderRadius: '0 8px 8px 0',
              }}
            >
              {qrData
                ? `${qrData.clinicName} - Rejoignez la file d'attente: ${qrData.url}`
                : `${clinicName} - Rejoignez la file d'attente`}
            </div>

            <button
              onClick={handleGenericSend}
              disabled={genericPhone.length === 0}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                padding: 14,
                background: genericPhone.length > 0 ? '#25D366' : '#E8E6DF',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: genericPhone.length > 0 ? 'white' : '#9E9B90',
                cursor: genericPhone.length > 0 ? 'pointer' : 'not-allowed',
                marginBottom: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chat</span>
              Envoyer via WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                padding: 14,
                background: '#F0EFEA',
                border: '1px solid #E8E6DF',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#6B6960',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Lien copi\u00e9 !' : 'Copier le lien'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
