import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DashboardChartPlaceholder() {
  return (
    <Card className="border-slate-200/90 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Phân tích &amp; Biểu đồ chi tiết
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Tích hợp trực tiếp với Module 8 (`/api/v1/reports/revenue` &amp;
              `/api/v1/reports/occupancy`) ở phase tiếp theo
            </CardDescription>
          </div>
          <Badge variant="secondary">Phase sau</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            Biểu đồ/dữ liệu — phase sau
          </p>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
            Khu vực này sẽ hiển thị biểu đồ doanh thu thuần (Net Revenue), tỷ lệ
            lấp đầy theo khung giờ và danh sách lịch đặt sân mới nhất.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
