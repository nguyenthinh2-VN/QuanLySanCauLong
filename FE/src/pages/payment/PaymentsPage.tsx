import { PaymentCollectCard } from '@/components/payment/PaymentCollectCard';
import { PaymentRefundCard } from '@/components/payment/PaymentRefundCard';

export function PaymentsPage() {
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
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800">
            Dành cho Nhân viên &amp; Quản trị viên
          </span>
        </div>
      </div>

      {/* 2 Tools Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Tool (a): Thu tiền đơn PENDING */}
        <div>
          <PaymentCollectCard />
        </div>

        {/* Tool (b): Hoàn tiền giao dịch */}
        <div>
          <PaymentRefundCard />
        </div>
      </div>
    </div>
  );
}

