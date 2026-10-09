package com.badminton.service.notification.impl;

import com.badminton.common.enums.NotificationChannel;
import com.badminton.dto.notification.NotificationMessage;
import com.badminton.service.notification.NotificationSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ConsoleEmailNotificationSender implements NotificationSender {

    @Override
    public boolean supports(NotificationChannel channel) {
        return NotificationChannel.EMAIL.equals(channel);
    }

    @Override
    public void send(NotificationMessage message) {
        log.info("======================================================================");
        log.info("[EMAIL SENDER] Đang gửi email thông báo...");
        log.info("Người nhận: {}", message.getRecipient());
        log.info("Tiêu đề:    {}", message.getSubject());
        log.info("Nội dung:   {}", message.getContent());
        if (message.getParams() != null && !message.getParams().isEmpty()) {
            log.info("Tham số đính kèm: {}", message.getParams());
        }
        log.info("Trạng thái: Gửi thành công (Mô phỏng Console Email)");
        log.info("======================================================================");
    }
}
