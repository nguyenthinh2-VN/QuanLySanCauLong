package com.badminton.modules.realtime;

import com.badminton.modules.booking.event.AvailabilityChangedEvent;
import com.badminton.modules.realtime.dto.AvailabilityMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AvailabilityBroadcastListener {

    private static final String TOPIC_AVAILABILITY = "/topic/availability";
    private static final String TYPE_AVAILABILITY_CHANGED = "AVAILABILITY_CHANGED";

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAvailabilityChanged(AvailabilityChangedEvent event) {
        AvailabilityMessage payload = new AvailabilityMessage(
                TYPE_AVAILABILITY_CHANGED,
                event.courtId(),
                event.bookingDate(),
                event.timeSlotId(),
                event.slotStatus()
        );

        log.info("Broadcasting availability changed to {}: courtId={}, date={}, slotId={}, status={}",
                TOPIC_AVAILABILITY, event.courtId(), event.bookingDate(), event.timeSlotId(), event.slotStatus());

        messagingTemplate.convertAndSend(TOPIC_AVAILABILITY, payload);
    }
}

