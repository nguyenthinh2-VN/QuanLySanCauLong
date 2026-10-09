package com.badminton.service.notification;

import com.badminton.common.enums.NotificationChannel;
import com.badminton.dto.notification.NotificationMessage;

public interface NotificationSender {

    boolean supports(NotificationChannel channel);

    void send(NotificationMessage message);
}
