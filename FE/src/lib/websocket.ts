import { Client } from '@stomp/stompjs';
import { API_BASE_URL, performTokenRefresh } from '@/lib/api';
import { getAccessToken, getRefreshToken } from '@/lib/auth';

export interface AvailabilityMessage {
  type: 'AVAILABILITY_CHANGED';
  courtId: number;
  bookingDate: string; // YYYY-MM-DD
  timeSlotId: number;
  slotStatus: 'FREE' | 'BOOKED' | 'PASSED' | 'UNAVAILABLE';
}

export type AvailabilityHandler = (message: AvailabilityMessage) => void;

function computeBrokerUrl(): string {
  // Bỏ /api/v1 ở cuối nếu có
  const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const url = new URL(cleanBase);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}/ws`;
}

let stompClient: Client | null = null;
let consecutiveFailures = 0;
const MAX_FAILURES = 5;

const listeners = new Set<AvailabilityHandler>();
let topicSubscription: { unsubscribe: () => void } | null = null;

function getOrCreateClient(): Client {
  if (stompClient) {
    return stompClient;
  }

  const brokerURL = computeBrokerUrl();

  stompClient = new Client({
    brokerURL,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: async (client) => {
      try {
        const refreshToken = getRefreshToken();
        let token = getAccessToken();

        // Nếu có refresh token, làm mới access token trước khi bắt tay CONNECT
        if (refreshToken) {
          try {
            token = await performTokenRefresh();
          } catch {
            // Giữ token hiện tại nếu refresh tạm thời lỗi
            token = getAccessToken();
          }
        }

        if (token) {
          client.connectHeaders = {
            Authorization: `Bearer ${token}`,
          };
        }
      } catch (err) {
        console.warn('[WebSocket] Lỗi cập nhật token trước khi connect:', err);
      }
    },
    onConnect: () => {
      consecutiveFailures = 0;
      if (stompClient) {
        stompClient.reconnectDelay = 5000;
      }

      // Đăng ký nhận tin nhắn availability duy nhất cho toàn ứng dụng
      if (!topicSubscription && stompClient) {
        topicSubscription = stompClient.subscribe('/topic/availability', (frame) => {
          try {
            const data = JSON.parse(frame.body) as AvailabilityMessage;
            listeners.forEach((handler) => {
              try {
                handler(data);
              } catch (handlerErr) {
                console.error('[WebSocket] Lỗi xử lý callback availability:', handlerErr);
              }
            });
          } catch (parseErr) {
            console.error('[WebSocket] Không thể parse frame body:', parseErr);
          }
        });
      }
    },
    onStompError: (frame) => {
      console.warn('[WebSocket] STOMP Error frame:', frame.headers['message']);
      consecutiveFailures += 1;
      checkFailureLimit();
    },
    onWebSocketClose: () => {
      topicSubscription = null;
    },
  });

  return stompClient;
}

function checkFailureLimit(): void {
  if (consecutiveFailures >= MAX_FAILURES && stompClient) {
    console.warn(`[WebSocket] Đã thử kết nối thất bại ${consecutiveFailures} lần. Tạm dừng kết nối.`);
    stompClient.reconnectDelay = 0;
    stompClient.deactivate();
  }
}

/**
 * Đảm bảo WebSocket client được kích hoạt.
 */
export function ensureConnected(): void {
  const token = getAccessToken();
  if (!token) {
    return; // Chưa đăng nhập thì không cần kích hoạt kết nối WebSocket bảo mật
  }

  const client = getOrCreateClient();
  if (!client.active) {
    client.reconnectDelay = 5000;
    client.activate();
  }
}

/**
 * Đăng ký nhận thông báo thay đổi trạng thái slot lịch trống.
 * Trả về hàm hủy đăng ký (unsubscribe).
 */
export function subscribeAvailability(handler: AvailabilityHandler): () => void {
  listeners.add(handler);
  ensureConnected();

  return () => {
    listeners.delete(handler);
  };
}

/**
 * Ngắt kết nối WebSocket khi đăng xuất hoặc dọn dẹp toàn bộ.
 */
export function disconnectRealtime(): void {
  if (stompClient) {
    if (topicSubscription) {
      try {
        topicSubscription.unsubscribe();
      } catch {
        // bỏ qua
      }
      topicSubscription = null;
    }
    listeners.clear();
    stompClient.deactivate();
    stompClient = null;
    consecutiveFailures = 0;
  }
}

