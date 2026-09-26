# Phase 10: Reporting (Public-facing)

## Mục tiêu
Trang báo cáo chi tiết cho admin với charts + export.

**Lưu ý:** Đã gộp 1 phần vào `phase9-admin` (tab Reports). Phase này bổ sung tính năng nâng cao:
- Export PDF
- Custom date range (không chỉ preset)
- So sánh kỳ (period comparison)

## Files cần tạo

```
src/features/report/
├── components/
│   ├── ReportFilters.tsx
│   ├── CustomDatePicker.tsx
│   ├── PeriodComparison.tsx
│   └── ExportButton.tsx
└── pages/
    └── AdvancedReportPage.tsx
```

## Chi tiết

### `CustomDatePicker.tsx`
- Input 2 ngày (from, to) với HTML5 date input
- Validate from ≤ to
- Callback `onChange({ from, to })`

### `PeriodComparison.tsx`
- Hiển thị so sánh kỳ hiện tại vs kỳ trước
- Props: `{ current: number, previous: number, label }`
- Trend: % change + mũi tên lên/xuống

### `ExportButton.tsx`
- Dropdown: "Xuất CSV" | "Xuất PDF"
- CSV: generate từ data client-side, download
- PDF: dùng `jsPDF` + `jspdf-autotable` → build bảng + chart image
- Props: `{ data, filename }`

### `AdvancedReportPage.tsx`
- Custom date range picker
- Period comparison cards
- Charts (reuse từ phase9)
- Export button
- Summary stats cuối

## Test
- Custom date range hoạt động
- So sánh kỳ chính xác
- Export CSV download file
- Export PDF download file

## Điều kiện hoàn thành
- [ ] Custom date picker
- [ ] Period comparison
- [ ] Export CSV
- [ ] Export PDF
- [ ] Dark mode