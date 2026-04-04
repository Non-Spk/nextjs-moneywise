# MoneyWise v2.0.0

ระบบจัดการการเงินส่วนบุคคลแบบครบวงจร - บันทึกรายรับ-รายจ่าย, จัดการบัตรเครดิต, ออมเงิน, ลงทุน, ให้ยืม, ติดตามบิลประจำ, คำนวณภาษีเงินได้บุคคลธรรมดา (ปีภาษี 2568), ทรัพย์สินกายภาพ พร้อม Export Excel

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + CSS Custom Properties (Design Token System)
- **Database:** PostgreSQL (Supabase) via Prisma ORM
- **Authentication:** NextAuth.js v5 (Credentials, JWT, 30-min session)
- **Runtime:** React 19
- **Design:** Apple HIG inspired, MUJI minimal aesthetic, responsive mobile-first

## Features

### Dashboard
- สรุปรายรับ-รายจ่ายรายเดือน/รายปี
- กราฟแท่งแยกตามหมวดหมู่ รายรับ/รายจ่าย
- สรุปหนี้บัตรเครดิต, เงินออม, การลงทุน, ทรัพย์สิน, ยอดให้ยืม
- แจ้งเตือนบิลที่ใกล้ครบกำหนด
- รายการธุรกรรมล่าสุด

### รายรับ-รายจ่าย
- บันทึกรายการพร้อมหมวดหมู่ 18+ ประเภท + custom categories
- โหมดพิเศษ: บันทึกเงินเดือน (แตกรายการอัตโนมัติ), จ่าย & ทอน
- ช่องทางชำระ: เงินสด, โอนเงิน, บัตรเครดิต
- ฟิลเตอร์ตามประเภท, ช่องทาง, หมวดหมู่, เดือน
- Pagination (50 รายการ/หน้า)
- Export Excel

### บัตรเครดิต & หนี้สิน
- เพิ่ม/ลบบัตรเครดิต (เก็บเฉพาะ 4 หลักสุดท้าย)
- ชำระหนี้, บันทึก Cashback
- แสดงวงเงิน, ยอดค้างชำระ, % การใช้งาน
- Export Excel

### เงินออม
- สร้างบัญชีออมหลายบัญชี พร้อมเป้าหมาย
- ฝาก/ถอน พร้อมบันทึกประวัติ
- เชื่อมโยงกับ dashboard balance อัตโนมัติ

### การลงทุน
- รองรับ: ทอง, หุ้น, กองทุน, คริปโต, พันธบัตร
- Multi-currency พร้อม exchange rate
- ซื้อ/ขาย/อัปเดตมูลค่า พร้อมประวัติ

### ให้ยืม & ทวงหนี้
- บันทึกการให้ยืม, ติดตามสถานะคืน
- สรุปตามคนยืม, ยอดค้างรวม
- Pagination (50 รายการ/หน้า)

### ทรัพย์สินกายภาพ
- บันทึกทรัพย์สิน: ทอง, อสังหา, รถ, ของสะสม
- ติดตามมูลค่าปัจจุบัน vs ราคาซื้อ

### บิล & การแจ้งเตือน
- บันทึกบิลประจำ, ติดตามสถานะชำระ
- แจ้งเตือนบิลใกล้ครบกำหนดภายใน 7 วัน
- Export Excel

### ภาษี & ลดหย่อน
- คำนวณภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (อัตราปี 2568)
- รายการลดหย่อน 23+ ประเภท
- Export Excel

### ระบบทั่วไป
- Dark / Light theme toggle
- Privacy mode (ซ่อน/แสดงยอดเงิน)
- Responsive design (mobile slide-in sidebar)
- Loading screen ทุกหน้า

## Security

- Password hashing: bcrypt (12 rounds), min 8 chars, max 128
- JWT session: 30 นาทีหมดอายุ, auto-logout ฝั่ง client
- Session cookie: ไม่ persist (ปิด browser = ต้อง login ใหม่)
- Rate limiting: login 10 attempts/15min, register 5 attempts/15min
- Timing attack prevention: constant-time bcrypt compare
- Middleware: server-level route protection, 401 for expired API calls
- Security headers: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Input validation: sanitize strings, clamp pagination (max 100), validate amounts (max 999M), validate enums
- Batch limit: max 20 transactions per request
- Error handling: try-catch ทุก API route, ไม่ leak stack trace
- Credit card: เก็บเฉพาะ 4 หลักสุดท้าย
- Ownership check: ทุก resource ตรวจสอบ userId ก่อน read/write/delete
- Register: generic error message ป้องกัน email enumeration

## Quick Start

### Requirements
- Node.js 18+
- npm
- PostgreSQL database (Supabase recommended)

### Install & Run

```bash
npm install
npx prisma migrate dev
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

หรือใช้ `MoneyWise.bat` (Windows) - รันเซิร์ฟเวอร์และเปิดเบราว์เซอร์อัตโนมัติ

### Environment Variables

คัดลอก `.env.example` เป็น `.env` แล้วแก้ค่า:

```env
DATABASE_URL="postgresql://user:password@host:6543/postgres"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

> generate secret: `openssl rand -base64 32`

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Protected routes
│   │   ├── dashboard/          # Dashboard
│   │   ├── transactions/       # รายรับ-รายจ่าย
│   │   ├── credit-cards/       # บัตรเครดิต
│   │   ├── bills/              # บิลประจำ
│   │   ├── savings/            # เงินออม
│   │   ├── investments/        # การลงทุน
│   │   ├── lendings/           # ให้ยืม
│   │   ├── assets/             # ทรัพย์สินกายภาพ
│   │   ├── tax/                # ภาษี & ลดหย่อน
│   │   ├── settings/           # ตั้งค่า
│   │   └── layout.tsx          # App layout + sidebar
│   ├── api/                    # API Routes
│   ├── login/                  # Login/Register
│   └── globals.css             # Design tokens (light/dark)
├── components/
│   ├── SessionProvider.tsx     # Auth session + auto-logout guard
│   ├── ThemeProvider.tsx       # Dark/Light + Privacy mode
│   ├── Sidebar.tsx             # Responsive sidebar (desktop fixed, mobile slide-in)
│   ├── Topbar.tsx              # Top bar + notifications
│   └── LoadingScreen.tsx       # Loading skeleton
├── lib/
│   ├── auth.ts                 # NextAuth config (JWT, rate limit, 30min expiry)
│   ├── prisma.ts               # Prisma client singleton
│   ├── api-helpers.ts          # Auth helper + safeResponse
│   ├── validation.ts           # Input validation (sanitize, clamp, parse)
│   ├── rate-limit.ts           # In-memory rate limiter
│   ├── constants.ts            # หมวดหมู่, อัตราภาษี, formatters
│   ├── privacy.ts              # Privacy mode utils
│   ├── useAmount.ts            # Amount display hook (privacy-aware)
│   └── export.ts               # Client-side Excel download
├── middleware.ts                # Route protection (server-level)
└── types/
    └── next-auth.d.ts          # NextAuth type extensions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | สมัครสมาชิก (rate limited) |
| GET/POST | `/api/transactions` | รายรับ-รายจ่าย (paginated) |
| DELETE | `/api/transactions/[id]` | ลบรายการ |
| GET | `/api/transactions/defaults` | Smart defaults สำหรับฟอร์ม |
| GET/POST | `/api/credit-cards` | บัตรเครดิต |
| PATCH/DELETE | `/api/credit-cards/[id]` | อัปเดต/ลบบัตร |
| POST | `/api/credit-cards/[id]/pay` | ชำระหนี้บัตร |
| POST | `/api/credit-cards/[id]/cashback` | บันทึก Cashback |
| GET/POST | `/api/bills` | บิลประจำ |
| PATCH/DELETE | `/api/bills/[id]` | อัปเดต/ลบบิล |
| GET/POST | `/api/savings` | บัญชีออม |
| POST/DELETE | `/api/savings/[id]` | ฝาก/ถอน/ลบบัญชี |
| GET/POST | `/api/investments` | การลงทุน |
| POST/DELETE | `/api/investments/[id]` | ซื้อ/ขาย/ลบ |
| GET/POST | `/api/lendings` | ให้ยืม (paginated) |
| PATCH/DELETE | `/api/lendings/[id]` | อัปเดต/ลบ |
| GET/POST | `/api/physical-assets` | ทรัพย์สินกายภาพ |
| PATCH/DELETE | `/api/physical-assets/[id]` | อัปเดต/ลบ |
| GET/POST | `/api/tax-deductions` | ค่าลดหย่อน |
| DELETE | `/api/tax-deductions/[id]` | ลบค่าลดหย่อน |
| GET/POST | `/api/categories` | Custom categories |
| PATCH/DELETE | `/api/categories/[id]` | อัปเดต/ลบ |
| GET/POST | `/api/exchange-rates` | อัตราแลกเปลี่ยน |
| GET | `/api/dashboard` | ข้อมูลสรุป |
| GET | `/api/export?type=...` | Export Excel |

## License

MIT
