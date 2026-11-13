import { useAuth } from '@/hooks/useAuth';
import { AdminVouchersView } from '@/components/voucher/AdminVouchersView';
import { CustomerVouchersView } from '@/components/voucher/CustomerVouchersView';

export function VouchersPage() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('ADMIN'));

  if (isAdmin) {
    return <AdminVouchersView />;
  }

  return <CustomerVouchersView />;
}

