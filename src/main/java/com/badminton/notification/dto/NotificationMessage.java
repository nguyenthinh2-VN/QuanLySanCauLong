package com.badminton.notification.dto;

import com.badminton.shared.constant.NotificationChannel;
import com.badminton.shared.constant.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Singular;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {

    private String recipient;

    private String subject;

    private String content;

    private NotificationChannel channel;

    private NotificationType type;

    @Singular
    private Map<String, Object> params;
}
