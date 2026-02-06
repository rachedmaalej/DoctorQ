interface DeleteClinicModalProps {
  isOpen: boolean;
  clinicName: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteClinicModal({ isOpen, clinicName, loading, onConfirm, onClose }: DeleteClinicModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white border border-[#E6F2F0] rounded-lg max-w-md w-full mx-4 shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FEF3EE] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#E15720]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">Delete Clinic</h3>
          </div>
          <p className="text-sm text-[#4E7572] mb-2">
            Are you sure you want to delete <strong className="text-[#132E2C]">{clinicName}</strong>?
          </p>
          <p className="text-sm text-[#E15720] mb-6">
            This action cannot be undone. All data including queue entries, payment records, and statistics will be permanently deleted.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[#4E7572] border border-[#D0E8E5] rounded-lg hover:bg-[#F3FAF9] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#E15720] rounded-lg hover:bg-[#c94a1a] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete Clinic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
