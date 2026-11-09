import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-t-4 border-t-zinc-900 text-center shadow-sm">
        <CardHeader className="space-y-3">
          <div className="mx-auto">
            <Badge variant="amber" className="px-3 py-1 text-xs font-semibold tracking-wider">
              404 NOT FOUND
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Không tìm thấy trang
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-slate-500">
            Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển trong hệ
            thống.
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="justify-center border-t border-slate-100 pt-5">
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

