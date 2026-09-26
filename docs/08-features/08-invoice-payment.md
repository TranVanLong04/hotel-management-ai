# Feature: Invoice & Payment

## Mục tiêu
Quản lý hóa đơn + thanh toán nhiều lần + hoàn tiền.

## Actors
- Staff (tạo, thêm payment)
- Admin (refund)
- Customer (xem)

## Preconditions
- Invoice chỉ tạo khi check-out
- Payment chỉ thêm khi invoice chưa `paid`

## Postconditions
- Invoice `status` chính xác
- Payment có `paid_at`, `method`, `status`
- Consistency booking + invoice + payments

## Business Rules

### Invoice
- 1 booking ↔ 1 invoice (UNIQUE)
- `total_amount` generated
- Snapshot `tax_rate`, `discount_rate`
- Không xóa — chỉ refund

### Payment
- amount > 0
- `refunded_amount ≤ amount`
- Tổng payments ≤ total
- Method: cash, bank_transfer, credit_card, online, other
- Status: pending, completed, failed, refunded

## Flows

**Tạo invoice + payment (trong checkout):**
- Xem flow ở `06-checkout.md`

**Payment bổ sung (partial):**
1. Admin/staff → /admin/invoices/:id
2. Click "Thêm thanh toán"
3. POST /api/invoices/:id/payments
4. Backend: verify status != paid → calc remaining → check amount ≤ remaining → insert → update status

**Refund:**
1. Admin → invoice detail
2. Click "Hoàn tiền"
3. POST /api/payments/:id/refund
4. Backend: verify refund ≤ (amount - refunded) → update refunded_amount → nếu hoàn hết → invoice status refunded

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | /api/invoices | Staff/Admin (customer own) |
| GET | /api/invoices/:id | Owner/Staff |
| POST | /api/invoices/:id/payments | Staff |
| POST | /api/payments/:id/refund | Admin |

## Database
- `invoices` — INSERT, SELECT, UPDATE status
- `payments` — INSERT, SELECT, UPDATE refunded_amount

## UI Components
- `features/invoice/pages/InvoiceListPage.tsx`
- `features/invoice/pages/InvoiceDetailPage.tsx`
- `features/invoice/components/InvoicePreview.tsx`
- `features/invoice/components/PaymentForm.tsx`
- `features/invoice/components/PaymentList.tsx`
- `features/invoice/components/RefundModal.tsx`

## Tests
- Unit: payment validation, refund logic
- Integration: full flow

## Edge Cases
| Case | Xử lý |
|------|-------|
| Invoice đã paid | 409 INVOICE_ALREADY_PAID |
| Payment > remaining | 400 |
| Refund > amount | 400 |
| Refund invoice unpaid | 400 |

## Related
- Checkout (`06`)
- Service Management (`07`)
- Reporting (`09`)