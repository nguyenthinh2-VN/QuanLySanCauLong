package com.badminton.notification.impl;

import com.badminton.notification.NotificationSender;
import com.badminton.notification.NotificationService;
import com.badminton.notification.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final List<NotificationSender> senders;

    @Override
    public void send(NotificationMessage message) {
        if (message == null || message.getChannel() == null) {
            log.warn("Không thể gửi thông báo: Thông điệp hoặc kênh gửi bị null");
            return;
        }

        boolean handled = false;
        for (NotificationSender sender : senders) {
            if (sender.supports(message.getChannel())) {
                sender.send(message);
                handled = true;
            }
        }

        if (!handled) {
            log.warn("Chưa có sender nào hỗ trợ kênh thông báo: {}", message.getChannel());
        }
    }
}
