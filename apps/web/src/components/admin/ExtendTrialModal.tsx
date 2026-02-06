import { useState } from 'react';
import { api } from '../../lib/api';

interface ExtendTrialModalProps {
  isOpen: boolean;
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onExtended: () => void;
}

export default function ExtendTrialModal({ isOpen, clinicId, clinicName, onClose, onExtended }: ExtendTrialModalProps) {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtend = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.extendClinicTrial(clinicId, days);
      onExtended();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to extend trial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white border border-[#E6F2F0] rounded-lg w-full max-w-sm shadow-lg">
        <div className="p-6">
          <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Extend Trial</h3>
          <p className="text-sm text-[#4E7572] mb-4">Extend trial period for <strong>{clinicName}</strong></p>

          {error && (
            <div className="mb-4 p-2 border border-[#E15720] text-[#E15720] text-sm rounded">{error}</div>
          )}

          <div className="flex gap-2 mb-4">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  days === d
                    ? 'bg-[#267B75] text-white border-[#267B75]'
                    : 'bg-white border-[#D0E8E5] text-[#132E2C] hover:bg-[#F3FAF9]'
                }`}
              >
                +{d} days
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-[#4E7572] border border-[#D0E8E5] rounded-lg hover:bg-[#F3FAF9] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExtend}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#267B75] rounded-lg hover:bg-[#1F6560] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Extending...' : `Extend +${days} days`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
