package com.badminton.notification;

import com.badminton.notification.dto.NotificationMessage;

public interface NotificationService {

    void send(NotificationMessage message);
}
