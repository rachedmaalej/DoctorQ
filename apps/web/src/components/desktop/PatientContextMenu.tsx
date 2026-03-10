import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { QueueEntry } from '@/types';

interface PatientContextMenuProps {
  open: boolean;
  anchorRect: DOMRect | null;
  entry: QueueEntry | null;
  onClose: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onCopyLink: () => void;
  onEmergency: () => void;
  onRemove: () => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  description: string;
  iconColor: string;
  labelColor?: string;
  hoverBg?: string;
  disabled?: boolean;
  onClick: () => void;
}

function MenuItem({ icon, label, description, iconColor, labelColor, hoverBg, disabled, onClick }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-[6px] border-none bg-transparent text-left transition-colors duration-100',
        disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : `cursor-pointer ${hoverBg ?? 'hover:bg-[#F4F5F1]'}`,
      )}
    >
      <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${iconColor}`}>{icon}</span>
      <div>
        <div className={`text-[12.5px] font-medium leading-tight ${labelColor ?? 'text-[#1B2D25]'}`}>{label}</div>
        <div className="text-[10px] text-[#94A49A] leading-tight">{description}</div>
      </div>
    </button>
  );
}

function MenuSectionLabel({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold tracking-[0.5px] uppercase text-[#94A49A] px-2.5 pt-1 pb-0.5">
      {label}
    </div>
  );
}

function MenuDivider() {
  return <div className="h-px bg-[#DDE2DC] my-0.5 mx-2" />;
}

export default function PatientContextMenu({
  open,
  anchorRect,
  entry,
  onClose,
  onCall,
  onWhatsApp,
  onCopyLink,
  onEmergency,
  onRemove,
}: PatientContextMenuProps) {
  const { t } = useTranslation();

  // Escape key closes menu
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !anchorRect || !entry) return null;

  const menuWidth = 220;
  const menuHeight = 240;

  let top = anchorRect.bottom + 6;
  let left = anchorRect.right - menuWidth;

  if (top + menuHeight > window.innerHeight) {
    top = anchorRect.top - menuHeight - 6;
  }
  if (left < 8) left = 8;

  const hasPhone = !!entry.patientPhone;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[199]" onClick={onClose} />

      <div
        role="menu"
        style={{ top, left, position: 'fixed', zIndex: 200, minWidth: menuWidth }}
        className="bg-white border border-[#DDE2DC] rounded-[10px] shadow-[0_8px_28px_rgba(27,45,37,0.14),0_2px_8px_rgba(27,45,37,0.07)] p-1 animate-menu-pop"
      >
        {/* Section: Contact */}
        <MenuSectionLabel label={t('queue.menu.contact')} />
        <MenuItem
          icon="call"
          label={t('queue.menu.call')}
          description={t('queue.menu.callDesc')}
          iconColor="text-[#2D7A5A]"
          disabled={!hasPhone}
          onClick={onCall}
        />
        <MenuItem
          icon="chat"
          label={t('queue.menu.whatsapp')}
          description={t('queue.menu.whatsappDesc')}
          iconColor="text-[#128C7E]"
          disabled={!hasPhone}
          onClick={onWhatsApp}
        />

        <MenuDivider />

        {/* Section: Queue */}
        <MenuSectionLabel label={t('queue.menu.queueSection')} />
        <MenuItem
          icon="link"
          label={t('queue.menu.copyLink')}
          description={t('queue.menu.copyLinkDesc')}
          iconColor="text-[#356B58]"
          onClick={onCopyLink}
        />
        <MenuItem
          icon="priority_high"
          label={t('queue.menu.emergency')}
          description={t('queue.menu.emergencyDesc')}
          iconColor="text-[#E07B39]"
          onClick={onEmergency}
        />

        <MenuDivider />

        {/* Destructive */}
        <MenuItem
          icon="person_remove"
          label={t('queue.menu.remove')}
          description={t('queue.menu.removeDesc')}
          iconColor="text-[#C0392B]"
          labelColor="text-[#C0392B]"
          hoverBg="hover:bg-[#FDEEEC]"
          onClick={onRemove}
        />
      </div>
    </>
  );
}
