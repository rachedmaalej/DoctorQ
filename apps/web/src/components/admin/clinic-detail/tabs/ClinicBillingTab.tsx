import type { ClinicDetail } from '../../../../types';
import { webBrand } from '../../../../lib/brand';

interface ClinicBillingTabProps {
  detail: ClinicDetail;
  actionLoading: string | null;
  onRecordPayment: () => void;
  onKonnectPayment: () => void;
}

export default function ClinicBillingTab({ detail, actionLoading, onRecordPayment, onKonnectPayment }: ClinicBillingTabProps) {
  const { payments, clinic } = detail;

  // Calculate totals
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      {/* Billing Summary */}
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-0 py-4 border-b border-[#E6F2F0]">
          <div className="text-center border-r border-[#E6F2F0]">
            <p className="text-xs text-[#8AADAA] uppercase mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-[#132E2C]">{totalPaid / webBrand.currency.multiplier} {webBrand.currency.symbol}</p>
          </div>
          <div className="text-center border-r border-[#E6F2F0]">
            <p className="text-xs text-[#8AADAA] uppercase mb-1">Plan</p>
            <p className="text-2xl font-bold text-[#132E2C]">{clinic.subscriptionPlan || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#8AADAA] uppercase mb-1">Payments</p>
            <p className="text-2xl font-bold text-[#132E2C]">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">Payment History</h3>
          <div className="flex gap-2">
            <button
              onClick={onKonnectPayment}
              disabled={actionLoading === 'konnect'}
              className="px-3 py-1.5 text-sm font-medium border border-[#D0E8E5] text-[#267B75] rounded hover:bg-[#F3FAF9] disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'konnect' ? 'Loading...' : 'Konnect Payment'}
            </button>
            <button
              onClick={onRecordPayment}
              className="px-3 py-1.5 text-sm font-medium bg-[#267B75] text-white rounded hover:bg-[#1F6560] transition-colors"
            >
              Record Payment
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-[#8AADAA] py-4">No payments recorded yet.</p>
        ) : (
          <div className="border border-[#E6F2F0] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[#E6F2F0]">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#4E7572] uppercase">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F2F0]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F3FAF9] transition-colors">
                    <td className="px-6 py-3 text-sm text-[#132E2C]">
                      {new Date(p.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-[#132E2C]">{p.amount / webBrand.currency.multiplier} {webBrand.currency.symbol}</td>
                    <td className="px-6 py-3 text-sm text-[#4E7572] capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="px-6 py-3 text-sm text-[#8AADAA]">{p.reference || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium ${
                        p.status === 'paid' ? 'text-[#337023]' :
                        p.status === 'pending' ? 'text-[#267B75]' :
                        'text-[#E15720]'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#4E7572]">
                      {new Date(p.paidAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
