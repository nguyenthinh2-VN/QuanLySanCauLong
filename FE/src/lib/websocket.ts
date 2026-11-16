import { Client } from '@stomp/stompjs';
import { API_BASE_URL, refreshAccessToken } from '@/lib/api';
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

// Cờ chống đếm trùng 1 lần lỗi giữa onStompError và onWebSocketClose
let failureCounted = false;

// Cờ đánh dấu đã chạm ngưỡng giới hạn 5 lần thất bại, dừng hẳn reconnect trong phiên hiện tại
// Đánh đổi này là cố ý: dừng hẳn còn hơn reconnect vô hạn mỗi 5s làm nghẽn client & spam server khi BE down.
// Kết nối chỉ được thử lại khi người dùng tải lại trang hoặc đăng nhập lại.
let reconnectStopped = false;

const listeners = new Set<AvailabilityHandler>();
let topicSubscription: { unsubscribe: () => void } | null = null;

function recordFailure(reason: string): void {
  if (!failureCounted) {
    consecutiveFailures += 1;
    failureCounted = true;
    console.warn(
      `[WebSocket] Kết nối thất bại lần ${consecutiveFailures}/${MAX_FAILURES}: ${reason}`
    );
    checkFailureLimit();
  }
}

function checkFailureLimit(): void {
  if (consecutiveFailures >= MAX_FAILURES && stompClient) {
    console.warn(
      `[WebSocket] Đã thử kết nối thất bại ${consecutiveFailures} lần liên tiếp. Dừng kết nối hoàn toàn trong phiên này.`
    );
    reconnectStopped = true;
    stompClient.reconnectDelay = 0;
    stompClient.deactivate();
  }
}

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

        // Nếu có refresh token, làm mới access token qua hàng đợi single-flight dùng chung trước khi CONNECT
        if (refreshToken) {
          try {
            token = await refreshAccessToken();
          } catch {
            // Giữ token hiện tại nếu refresh lỗi để STOMP CONNECT thử như thường
            // (không clear storage, không redirect /login từ đường WebSocket)
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
      failureCounted = false;
      reconnectStopped = false;
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
      const errorMsg = frame.headers['message'] || 'Lỗi giao thức STOMP';
      console.warn('[WebSocket] STOMP Error frame:', errorMsg);
      recordFailure(errorMsg);
    },
    onWebSocketClose: () => {
      topicSubscription = null;
      // Chỉ tính lỗi khi client đang active (không phải do gọi deactivate() chủ động)
      if (stompClient?.active) {
        recordFailure('WebSocket connection closed');
      }
      // Đóng socket kết thúc một chu kỳ bắt tay -> clear cờ để lần thử kế tiếp được đếm
      failureCounted = false;
    },
  });

  return stompClient;
}

/**
 * Đảm bảo WebSocket client được kích hoạt.
 * Chú ý: Nếu đã chạm giới hạn 5 lần thất bại liên tiếp (reconnectStopped === true),
 * hàm sẽ return sớm và không thử kết nối lại trong cùng phiên.
 */
export function ensureConnected(): void {
  if (reconnectStopped) {
    return;
  }

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
    failureCounted = false;
    reconnectStopped = false;
  }
}
