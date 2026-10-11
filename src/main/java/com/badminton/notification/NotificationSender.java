package com.badminton.notification;

import com.badminton.notification.dto.NotificationMessage;
import com.badminton.shared.constant.NotificationChannel;

public interface NotificationSender {

    boolean supports(NotificationChannel channel);

    void send(NotificationMessage message);
}
