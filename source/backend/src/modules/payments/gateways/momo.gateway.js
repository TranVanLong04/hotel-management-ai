import crypto from 'crypto';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { BadRequestError, InternalError } from '../../../utils/errors.js';

/**
 * MoMo Gateway Client — Tích hợp cổng thanh toán MoMo v2
 */

/**
 * Tạo URL thanh toán qua MoMo
 *
 * @param {Object} params
 * @param {string} params.bookingId - UUID booking
 * @param {string} params.bookingCode - Mã booking (VD: BK20261001001)
 * @param {number} params.amount - Số tiền VND
 * @param {string} [params.orderInfo] - Mô tả đơn hàng
 * @returns {Promise<{ payUrl: string, deeplink?: string, qrCodeUrl?: string, orderId: string, requestId: string, resultCode: number }>}
 */
export const createMomoPayment = async ({
  bookingId,
  bookingCode,
  amount,
  orderInfo,
}) => {
  const partnerCode = env.MOMO_PARTNER_CODE;
  const accessKey = env.MOMO_ACCESS_KEY;
  const secretKey = env.MOMO_SECRET_KEY;
  const redirectUrl = env.MOMO_REDIRECT_URL;
  const ipnUrl = env.MOMO_IPN_URL;
  const requestType = 'payWithMethod';
  const autoCapture = true;
  const extraData = Buffer.from(JSON.stringify({ bookingId })).toString('base64');
  const orderGroupId = '';

  const orderId = `${partnerCode}_${Date.now()}`;
  const requestId = orderId;
  const description = orderInfo || `Thanh toán đặt phòng ${bookingCode}`;

  // Tạo chuỗi ký HMAC SHA256 theo chuẩn format của MoMo v2
  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${description}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode,
    partnerName: 'Hotel AI',
    storeId: 'HotelAIStore',
    requestId,
    amount,
    orderId,
    orderInfo: description,
    redirectUrl,
    ipnUrl,
    lang: 'vi',
    requestType,
    autoCapture,
    extraData,
    orderGroupId,
    signature,
  };

  logger.info(
    { orderId, bookingId, amount, endpoint: env.MOMO_API_URL },
    'MomoGateway: Đang gửi yêu cầu tạo thanh toán đến MoMo'
  );

  try {
    const response = await fetch(env.MOMO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.resultCode !== 0) {
      logger.error(
        { response: data, orderId },
        'MomoGateway: MoMo trả về mã lỗi tạo thanh toán'
      );
      throw new BadRequestError(data.message || 'Không thể tạo liên kết thanh toán MoMo');
    }

    return {
      payUrl: data.payUrl,
      deeplink: data.deeplink,
      qrCodeUrl: data.qrCodeUrl,
      orderId,
      requestId,
      resultCode: data.resultCode,
    };
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    logger.error({ err, orderId }, 'MomoGateway: Lỗi mạng hoặc kết nối tới MoMo API');
    throw new InternalError('Không thể kết nối tới cổng thanh toán MoMo');
  }
};

/**
 * Kiểm tra và xác thực chữ ký IPN Webhook từ MoMo (Strict 13 fields HMAC SHA256)
 *
 * @param {Object} payload - Dữ liệu POST từ MoMo IPN
 * @returns {{ valid: boolean, bookingId: string | null, data: Object }}
 */
export const verifyMomoIpn = (payload) => {
  const secretKey = env.MOMO_SECRET_KEY;
  const accessKey = env.MOMO_ACCESS_KEY;

  const {
    partnerCode = '',
    orderId = '',
    requestId = '',
    amount = '',
    orderInfo = '',
    orderType = '',
    transId = '',
    resultCode = '',
    message = '',
    payType = '',
    responseTime = '',
    extraData = '',
    signature = '',
  } = payload;

  logger.info(
    {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      resultCode,
      transId,
    },
    'MomoGateway: Nhận IPN Webhook từ MoMo'
  );

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`;

  const calculatedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const valid = Boolean(signature) && calculatedSignature === signature;

  let bookingId = null;
  if (extraData) {
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
      bookingId = decoded.bookingId || null;
    } catch {
      bookingId = null;
    }
  }

  return {
    valid,
    bookingId,
    data: {
      orderId,
      requestId,
      amount: Number(amount),
      transId: String(transId),
      resultCode: Number(resultCode),
      message,
      payType,
      responseTime,
      extraData,
    },
  };
};

/**
 * Xử lý và kiểm tra dữ liệu Return URL từ MoMo (khi redirect qua browser)
 *
 * @param {Object} query - Query parameters từ MoMo redirect
 * @returns {{ valid: boolean, bookingId: string | null, data: Object, requiresDbCheck: boolean }}
 */
export const verifyMomoReturn = (query) => {
  const secretKey = env.MOMO_SECRET_KEY;
  const accessKey = env.MOMO_ACCESS_KEY;

  const {
    partnerCode = '',
    orderId = '',
    requestId = '',
    amount = '',
    orderInfo = '',
    orderType = '',
    transId = '',
    resultCode,
    message = '',
    payType = '',
    responseTime = '',
    extraData = '',
    signature = '',
  } = query;

  logger.info(
    {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      resultCode,
      hasSignature: Boolean(signature),
    },
    'MomoGateway: Nhận Return URL redirect từ MoMo'
  );

  let bookingId = null;
  if (extraData) {
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
      bookingId = decoded.bookingId || null;
    } catch {
      bookingId = null;
    }
  }

  // Nếu có chữ ký trong query URL, tiến hành verify HMAC
  if (signature) {
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode ?? ''}` +
      `&transId=${transId}`;

    const calculatedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const valid = calculatedSignature === signature;

    return {
      valid,
      bookingId,
      requiresDbCheck: false,
      data: {
        orderId,
        requestId,
        amount: Number(amount || 0),
        transId: String(transId),
        resultCode: resultCode !== undefined ? Number(resultCode) : 0,
        message,
        payType,
        responseTime,
        extraData,
      },
    };
  }

  // Trường hợp cổng test MoMo redirect URL không kèm signature:
  // Cho phép tiếp tục và đánh dấu cần kiểm tra trạng thái trong DB
  return {
    valid: true,
    bookingId,
    requiresDbCheck: true,
    data: {
      orderId,
      requestId,
      amount: Number(amount || 0),
      transId: String(transId || ''),
      resultCode: resultCode !== undefined ? Number(resultCode) : 0,
      message: message || '',
      payType: payType || '',
      responseTime: responseTime || '',
      extraData: extraData || '',
    },
  };
};

/**
 * Alias tương thích ngược cho IPN
 */
export const verifyMomoCallback = verifyMomoIpn;

/**
 * Tra cứu trạng thái giao dịch MoMo (Dùng khi IPN không tới)
 *
 * @param {string} orderId
 * @param {string} requestId
 */
export const queryMomoTransaction = async (orderId, requestId) => {
  const partnerCode = env.MOMO_PARTNER_CODE;
  const accessKey = env.MOMO_ACCESS_KEY;
  const secretKey = env.MOMO_SECRET_KEY;

  const rawSignature =
    `accessKey=${accessKey}` +
    `&orderId=${orderId}` +
    `&partnerCode=${partnerCode}` +
    `&requestId=${requestId}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const response = await fetch(env.MOMO_QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerCode,
      requestId,
      orderId,
      signature,
      lang: 'vi',
    }),
  });

  return response.json();
};
