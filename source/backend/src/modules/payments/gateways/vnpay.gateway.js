import crypto from 'crypto';
import qs from 'querystring';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { InternalError } from '../../../utils/errors.js';

/**
 * VNPay Gateway Client — Tích hợp cổng thanh toán VNPay (v2.1.0)
 */

/**
 * Hàm loại bỏ dấu tiếng Việt để chuẩn hóa vnp_OrderInfo
 * @param {string} str
 * @returns {string}
 */
export const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
};

/**
 * Hàm sắp xếp các thuộc tính của object theo thứ tự bảng chữ cái (alphabetical)
 * @param {Object} obj
 */
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      sorted[key] = obj[key];
    }
  }
  return sorted;
};

/**
 * Format ngày giờ hiện tại sang định dạng YYYYMMDDHHmmss theo múi giờ VN (GMT+7)
 */
const formatVNPayDate = (date = new Date()) => {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const YYYY = vnTime.getUTCFullYear();
  const MM = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(vnTime.getUTCDate()).padStart(2, '0');
  const HH = String(vnTime.getUTCHours()).padStart(2, '0');
  const mm = String(vnTime.getUTCMinutes()).padStart(2, '0');
  const ss = String(vnTime.getUTCSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
};

/**
 * Kiểm tra xem VNPay đã được cấu hình credentials thật hay chưa (không phải TEST hoặc placeholder)
 * @returns {boolean}
 */
export const isVnpayConfigured = () => {
  const tmnCode = env.VNPAY_TMN_CODE;
  const secretKey = env.VNPAY_HASH_SECRET;

  return Boolean(
    tmnCode &&
    secretKey &&
    !tmnCode.startsWith('TEST') &&
    !tmnCode.startsWith('YOUR_') &&
    !secretKey.startsWith('TEST') &&
    !secretKey.startsWith('YOUR_')
  );
};

/**
 * Tạo URL thanh toán qua VNPay
 *
 * @param {Object} params
 * @param {string} params.bookingId - UUID booking
 * @param {string} params.bookingCode - Mã booking
 * @param {number} params.amount - Số tiền VND
 * @param {string} [params.orderInfo] - Mô tả giao dịch
 * @param {string} [params.ipAddr] - Địa chỉ IP client
 * @returns {Promise<{ paymentUrl: string, txnRef: string }>}
 */
export const createVnpayPayment = async ({
  bookingId,
  bookingCode,
  amount,
  orderInfo,
  ipAddr = '127.0.0.1',
}) => {
  const tmnCode = env.VNPAY_TMN_CODE;
  const secretKey = env.VNPAY_HASH_SECRET;
  const vnpUrl = env.VNPAY_URL;
  const returnUrl = env.VNPAY_RETURN_URL;

  // Kiểm tra cấu hình credentials VNPay (nếu là TEST / placeholder thì ném lỗi)
  if (!isVnpayConfigured()) {
    throw new InternalError(
      'VNPay chưa được cấu hình. Vui lòng đăng ký sandbox tại https://sandbox.vnpayment.vn/devreg/'
    );
  }

  // Chuẩn hóa IP
  let clientIp = ipAddr || '127.0.0.1';
  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    clientIp = '127.0.0.1';
  }

  const createDate = formatVNPayDate();
  // TxnRef format: bookingCode-timestamp
  const txnRef = `${bookingCode}-${Date.now()}`;
  const description = removeVietnameseTones(
    orderInfo || `Thanh toan dat phong ${bookingCode}`
  );

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: description,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount * 100), // VNPay yêu cầu nhân 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: clientIp,
    vnp_CreateDate: createDate,
  };

  // Sắp xếp params theo thứ tự alphabet TRƯỚC khi build signData
  const sortedParams = sortObject(vnpParams);

  // Tạo chuỗi ký
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  sortedParams['vnp_SecureHash'] = secureHash;

  const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams, { encode: true })}`;

  logger.info(
    {
      rawSignature: signData,
      secureHash,
      orderInfo: description,
      amount: vnpParams.vnp_Amount,
      createDate,
      txnRef,
      bookingId,
    },
    'VnpayGateway: Đã tạo URL thanh toán VNPay'
  );

  return {
    paymentUrl,
    txnRef,
  };
};

/**
 * Kiểm tra và xác thực chữ ký callback / IPN từ VNPay
 *
 * @param {Object} query - Query parameters từ VNPay
 * @returns {{ valid: boolean, isSuccess: boolean, txnRef: string, data: Object }}
 */
export const verifyVnpayCallback = (query) => {
  const secretKey = env.VNPAY_HASH_SECRET;

  const vnpParams = { ...query };
  const secureHash = vnpParams['vnp_SecureHash'];

  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const valid = secureHash === signed;
  const responseCode = vnpParams['vnp_ResponseCode'];
  const isSuccess = valid && responseCode === '00';
  const txnRef = String(vnpParams['vnp_TxnRef'] || '');

  return {
    valid,
    isSuccess,
    txnRef,
    data: {
      amount: Number(vnpParams['vnp_Amount'] || 0) / 100,
      bankCode: vnpParams['vnp_BankCode'],
      bankTranNo: vnpParams['vnp_BankTranNo'],
      cardType: vnpParams['vnp_CardType'],
      orderInfo: vnpParams['vnp_OrderInfo'],
      payDate: vnpParams['vnp_PayDate'],
      responseCode: vnpParams['vnp_ResponseCode'],
      tmnCode: vnpParams['vnp_TmnCode'],
      transactionNo: vnpParams['vnp_TransactionNo'],
      transactionStatus: vnpParams['vnp_TransactionStatus'],
      txnRef,
    },
  };
};
