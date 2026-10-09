package com.badminton.service.notification.impl;

import com.badminton.common.enums.NotificationChannel;
import com.badminton.dto.notification.NotificationMessage;
import com.badminton.service.notification.NotificationSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ConsoleSmsNotificationSender implements NotificationSender {

    @Override
    public boolean supports(NotificationChannel channel) {
        return NotificationChannel.SMS.equals(channel);
    }

    @Override
    public void send(NotificationMessage message) {
        log.info("======================================================================");
        log.info("[SMS SENDER] Đang gửi tin nhắn SMS...");
        log.info("Số điện thoại nhận: {}", message.getRecipient());
        log.info("Nội dung SMS:       {}", message.getContent());
        log.info("Trạng thái: Gửi thành công (Mô phỏng Console SMS)");
        log.info("======================================================================");
    }
}
