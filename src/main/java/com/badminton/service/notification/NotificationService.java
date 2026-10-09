package com.badminton.service.notification;

import com.badminton.dto.notification.NotificationMessage;

public interface NotificationService {

    void send(NotificationMessage message);
}
