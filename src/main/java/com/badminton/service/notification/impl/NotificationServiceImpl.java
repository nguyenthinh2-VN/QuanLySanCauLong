package com.badminton.service.notification.impl;

import com.badminton.dto.notification.NotificationMessage;
import com.badminton.service.notification.NotificationSender;
import com.badminton.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    // Dependency Inversion & Strategy Pattern: Tự động gom toàn bộ bean triển khai
    // NotificationSender
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
