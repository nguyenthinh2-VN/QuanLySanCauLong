import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface FeaturePlaceholderProps {
  title: string;
  description: string;
  moduleTag: string;
  endpointHint?: string;
}

export function FeaturePlaceholder({
  title,
  description,
  moduleTag,
  endpointHint,
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="emerald">{moduleTag}</Badge>
            <Badge variant="amber">Phase sau</Badge>
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            {title}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-slate-600">
            {description}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
            <Badge variant="secondary" className="mb-3">
              Đang chờ tích hợp giao diện nghiệp vụ
            </Badge>
            <p className="max-w-lg text-sm font-medium text-slate-700">
              Route và phân quyền truy cập (`RoleRoute`) đã được cấu hình hoàn chỉnh
              trong Phase 1. Giao diện bảng biểu, bộ lọc và form tương tác sẽ được
              triển khai ở phase tiếp theo.
            </p>
            {endpointHint && (
              <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                API Backend sẵn sàng: {endpointHint}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

