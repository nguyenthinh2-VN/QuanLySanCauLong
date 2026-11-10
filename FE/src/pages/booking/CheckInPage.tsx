import { useState } from 'react';
import { CheckInFormCard } from '@/components/booking/CheckInFormCard';
import { CheckInResultCard } from '@/components/booking/CheckInResultCard';
import { extractErrorMessage } from '@/lib/auth';
import { checkInBooking } from '@/lib/booking';
import type { BookingResponse } from '@/types/booking';

export function CheckInPage() {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedInBooking, setCheckedInBooking] =
    useState<BookingResponse | null>(null);

  async function handleCheckIn(bookingId: number) {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await checkInBooking(bookingId);
      setCheckedInBooking(updated);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          'Không thể thực hiện check-in cho mã đơn này'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkedInBooking) {
    return (
      <div className="py-4">
        <CheckInResultCard
          booking={checkedInBooking}
          onCheckInAnother={() => {
            setCheckedInBooking(null);
            setErrorMessage(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-2">
      <CheckInFormCard
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmitCheckIn={handleCheckIn}
        onClearError={() => setErrorMessage(null)}
      />
    </div>
  );
}

