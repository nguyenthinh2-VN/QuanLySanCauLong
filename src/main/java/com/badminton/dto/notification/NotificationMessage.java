package com.badminton.dto.notification;

import com.badminton.common.enums.NotificationChannel;
import com.badminton.common.enums.NotificationType;
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
