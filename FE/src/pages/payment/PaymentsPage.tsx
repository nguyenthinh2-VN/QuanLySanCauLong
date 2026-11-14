import { useState } from 'react';
import { PaymentCollectCard } from '@/components/payment/PaymentCollectCard';
import { PaymentHistorySection } from '@/components/payment/PaymentHistorySection';
import {
  PaymentRefundCard,
  type RefundTriggerRequest,
} from '@/components/payment/PaymentRefundCard';

export function PaymentsPage() {
  const [refundRequest, setRefundRequest] =
    useState<RefundTriggerRequest | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  return (
    <div className="space-y-6">
      {/* Page Title & Context Banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              Quản lý Thanh toán &amp; Hoàn tiền
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Xử lý thu tiền trực tiếp cho các đơn đặt sân trực tuyến chờ thanh toán và thực hiện hoàn tiền giao dịch theo quy định.
            </p>
          </div>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Dành cho Nhân viên &amp; Quản trị viên
          </span>
        </div>
      </div>

      {/* 2 Tools Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div>
          <PaymentCollectCard />
        </div>

        <div>
          <PaymentRefundCard
            refundRequest={refundRequest}
            onRefundSuccess={() => setRefreshTrigger((n) => n + 1)}
          />
        </div>
      </div>

      {/* System-wide Transaction History */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">
          Lịch sử giao dịch toàn hệ thống
        </h2>
        <PaymentHistorySection
          mode="staff"
          refreshTrigger={refreshTrigger}
          onSelectRefund={(id) =>
            setRefundRequest({ paymentId: id, requestKey: Date.now() })
          }
        />
      </div>
    </div>
  );
}

