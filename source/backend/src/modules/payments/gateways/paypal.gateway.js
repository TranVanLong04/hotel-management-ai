import axios from 'axios';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { BadRequestError, InternalError } from '../../../utils/errors.js';

/**
 * PayPal Gateway Client — Tích hợp cổng thanh toán PayPal Checkout REST API v2 (Sandbox)
 */

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Kiểm tra xem PayPal đã được cấu hình hợp lệ chưa
 */
export const isPaypalConfigured = () => {
  return Boolean(
    env.PAYPAL_CLIENT_ID &&
    env.PAYPAL_CLIENT_SECRET &&
    env.PAYPAL_CLIENT_ID !== 'your_sandbox_client_id' &&
    env.PAYPAL_CLIENT_SECRET !== 'your_sandbox_secret'
  );
};

/**
 * Lấy OAuth2 Access Token từ PayPal API
 */
export const getAccessToken = async () => {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const apiUrl = env.PAYPAL_API_URL;

  if (!clientId || !clientSecret) {
    throw new BadRequestError('PAYPAL_CLIENT_ID hoặc PAYPAL_CLIENT_SECRET chưa được cấu hình trong .env');
  }

  // Sử dụng token cached nếu còn hạn (trừ hao 60s)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(
      `${apiUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
    logger.info('Lấy PayPal OAuth2 Access Token thành công');
    return cachedToken;
  } catch (error) {
    logger.error(
      {
        err: error.response?.data || error.message,
        status: error.response?.status,
      },
      'Lỗi khi lấy PayPal Access Token'
    );
    throw new InternalError('Không thể kết nối đến PayPal API. Vui lòng kiểm tra Client ID & Secret.');
  }
};

/**
 * Tạo đơn hàng thanh toán trên PayPal (Create Order)
 *
 * @param {Object} params
 * @param {string} params.bookingId - UUID booking
 * @param {string} params.bookingCode - Mã booking (VD: BK20261114001)
 * @param {number} params.amount - Số tiền VND (tự động quy đổi sang USD cho PayPal)
 * @param {string} [params.orderInfo] - Mô tả đơn hàng
 * @returns {Promise<{ gateway: 'paypal', payUrl: string, orderId: string, status: string, usdAmount: string, originalAmount: number }>}
 */
export const createPayment = async ({
  bookingId,
  bookingCode,
  amount,
  orderInfo,
}) => {
  const accessToken = await getAccessToken();
  const apiUrl = env.PAYPAL_API_URL;
  const returnUrl = env.PAYPAL_RETURN_URL;
  const cancelUrl = env.PAYPAL_CANCEL_URL;

  // PayPal Sandbox không hỗ trợ VND cho nhiều tài khoản; tự động quy đổi VND -> USD (tỷ giá ~25,000 VND)
  const EXCHANGE_RATE = 25000;
  const usdValue =
    amount > 1000
      ? (amount / EXCHANGE_RATE).toFixed(2)
      : Number(amount || 1).toFixed(2);

  const description = orderInfo || `Thanh toán đặt phòng ${bookingCode}`;

  const requestBody = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: bookingId,
        custom_id: bookingId,
        description: description.substring(0, 127),
        amount: {
          currency_code: 'USD',
          value: usdValue,
        },
      },
    ],
    application_context: {
      brand_name: 'Grand Luxury Hotel',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: returnUrl.includes('?') ? `${returnUrl}&bookingId=${bookingId}` : `${returnUrl}?bookingId=${bookingId}`,
      cancel_url: cancelUrl.includes('?') ? `${cancelUrl}&bookingId=${bookingId}` : `${cancelUrl}?bookingId=${bookingId}`,
    },
  };

  try {
    logger.info({ bookingId, bookingCode, usdValue }, 'Gửi yêu cầu tạo PayPal Order');

    const response = await axios.post(`${apiUrl}/v2/checkout/orders`, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    const orderData = response.data;
    const approveLink = orderData.links?.find((l) => l.rel === 'approve')?.href;

    if (!approveLink) {
      logger.error({ orderData }, 'PayPal không trả về approve link');
      throw new InternalError('PayPal không trả về liên kết thanh toán');
    }

    logger.info(
      { orderId: orderData.id, status: orderData.status, approveLink },
      'Tạo PayPal Order thành công'
    );

    return {
      gateway: 'paypal',
      orderId: orderData.id,
      payUrl: approveLink,
      status: orderData.status,
      usdAmount: usdValue,
      originalAmount: amount,
    };
  } catch (error) {
    logger.error(
      {
        err: error.response?.data || error.message,
        status: error.response?.status,
      },
      'Lỗi khi gọi PayPal /v2/checkout/orders'
    );
    const detail =
      error.response?.data?.message ||
      error.response?.data?.details?.[0]?.description ||
      error.message;
    throw new InternalError(`Lỗi tạo đơn PayPal: ${detail}`);
  }
};

/**
 * Capture thanh toán sau khi khách hàng đồng ý trên PayPal (Capture Order)
 *
 * @param {string} orderId - PayPal Order ID (token từ return URL)
 * @returns {Promise<Object>} Chi tiết kết quả capture từ PayPal
 */
export const capturePayment = async (orderId) => {
  const accessToken = await getAccessToken();
  const apiUrl = env.PAYPAL_API_URL;

  try {
    logger.info({ orderId }, 'Gửi yêu cầu Capture PayPal Order');

    const response = await axios.post(
      `${apiUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const captureData = response.data;
    const purchaseUnit = captureData.purchase_units?.[0] || {};
    const capture = purchaseUnit.payments?.captures?.[0] || {};
    const bookingId = purchaseUnit.custom_id || purchaseUnit.reference_id;

    logger.info(
      {
        orderId: captureData.id,
        status: captureData.status,
        captureId: capture.id,
        bookingId,
      },
      'Capture PayPal Order thành công'
    );

    return {
      success: captureData.status === 'COMPLETED' || capture.status === 'COMPLETED',
      status: captureData.status,
      orderId: captureData.id,
      captureId: capture.id || captureData.id,
      bookingId,
      amount: capture.amount?.value,
      currency: capture.amount?.currency_code,
      payer: captureData.payer,
      raw: captureData,
    };
  } catch (error) {
    logger.error(
      {
        err: error.response?.data || error.message,
        status: error.response?.status,
        orderId,
      },
      'Lỗi khi Capture PayPal Order'
    );
    const detail =
      error.response?.data?.message ||
      error.response?.data?.details?.[0]?.description ||
      error.message;
    throw new InternalError(`Không thể xác nhận giao dịch PayPal: ${detail}`);
  }
};

