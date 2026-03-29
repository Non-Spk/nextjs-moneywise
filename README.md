# MoneyWise v1.0.0

ระบบจัดการการเงินส่วนบุคคลแบบครบวงจร - บันทึกรายรับ-รายจ่าย, จัดการบัตรเครดิต, ติดตามบิลประจำ, คำนวณภาษีเงินได้บุคคลธรรมดา (ปีภาษี 2568) พร้อม Export Excel

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + CSS Custom Properties (Design Token System)
- **Database:** SQLite (Prisma ORM)
- **Authentication:** NextAuth.js v5 (Credentials, JWT)
- **Runtime:** React 19
- **Design:** Apple Human Interface Guidelines inspired - MUJI minimal aesthetic

## Features

### Dashboard
- สรุปรายรับ-รายจ่ายรายเดือน (กรองตามเดือนได้)
- กราฟแท่งแยกตามหมวดหมู่ รายรับ/รายจ่าย
- แจ้งเตือนบิลที่ใกล้ครบกำหนด
- รายการธุรกรรมล่าสุด

### รายรับ-รายจ่าย
- บันทึกรายการพร้อมหมวดหมู่ 18 ประเภท (อาหาร, เดินทาง, เงินเดือน, ฟรีแลนซ์ ฯลฯ)
- ช่องทางชำระ: เงินสด, โอนเงิน, บัตรเครดิต
- เชื่อมโยงรายจ่ายกับบัตรเครดิตได้
- ฟิลเตอร์ตามประเภท, ช่องทาง, หมวดหมู่, เดือน
- Export Excel

### บัตรเครดิต & หนี้สิน
- เพิ่ม/ลบบัตรเครดิต (เก็บเฉพาะ 4 หลักสุดท้าย)
- แสดงวงเงิน, ยอดค้างชำระ, % การใช้งาน พร้อม color-coded indicator
- ตารางสรุปหนี้สินรวมทุกบัตร
- Export Excel

### บิล & การแจ้งเตือน
- บันทึกบิลประจำ (ค่าน้ำ, ค่าไฟ, ค่าเช่า ฯลฯ)
- ติดตามสถานะชำระ/ยังไม่ชำระ
- แจ้งเตือนบิลใกล้ครบกำหนดภายใน 7 วัน (Topbar notification)
- Export Excel

### ภาษี & ลดหย่อน
- คำนวณภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (อัตราปี 2568)
- ค่าลดหย่อนอัตโนมัติ: ส่วนตัว 60,000 + ค่าใช้จ่าย 50% (สูงสุด 100,000)
- รายการลดหย่อน 23+ ประเภท (ประกันชีวิต, RMF, SSF, Thai ESG, ดอกเบี้ยบ้าน ฯลฯ)
- ตารางอัตราภาษีขั้นบันไดอ้างอิง
- Export Excel

### ระบบทั่วไป
- Dark / Light theme toggle
- Responsive design
- ระบบ Login / Register พร้อม password hashing (bcrypt)
- Session-based auth guard ทุกหน้า
- Frosted glass topbar with notification badge

## Quick Start

### Requirements
- Node.js 18+
- npm

### Install & Run

```bash
npm install
npx prisma migrate dev
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

หรือใช้ `MoneyWise.bat` (Windows) - จะรันเซิร์ฟเวอร์และเปิดเบราว์เซอร์ให้อัตโนมัติ

### Environment Variables

สร้างไฟล์ `.env` ที่ root:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

> **สำคัญ:** ต้องเปลี่ยน `NEXTAUTH_SECRET` เป็นค่า random ของตัวเอง สร้างได้ด้วย `openssl rand -base64 32`

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Protected routes (ต้อง login)
│   │   ├── dashboard/          # หน้า Dashboard
│   │   ├── transactions/       # หน้ารายรับ-รายจ่าย
│   │   ├── credit-cards/       # หน้าบัตรเครดิต
│   │   ├── bills/              # หน้าบิลประจำ
│   │   ├── tax/                # หน้าภาษี & ลดหย่อน
│   │   └── layout.tsx          # Layout + auth guard
│   ├── api/                    # API Routes
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── register/           # สมัครสมาชิก
│   │   ├── dashboard/          # ข้อมูล dashboard
│   │   ├── transactions/       # CRUD รายรับ-รายจ่าย
│   │   ├── credit-cards/       # CRUD บัตรเครดิต
│   │   ├── bills/              # CRUD บิลประจำ
│   │   ├── tax-deductions/     # CRUD ค่าลดหย่อน
│   │   └── export/             # Export Excel (.xlsx)
│   ├── login/                  # หน้า Login/Register
│   ├── globals.css             # Design token system (light/dark)
│   └── layout.tsx              # Root layout
├── components/
│   ├── SessionProvider.tsx     # NextAuth session wrapper
│   ├── ThemeProvider.tsx       # Dark/Light theme context
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── Topbar.tsx              # Top bar + notifications
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client singleton
│   ├── api-helpers.ts          # Auth helper for API routes
│   ├── constants.ts            # หมวดหมู่, อัตราภาษี, formatters
│   └── export.ts               # Client-side Excel download
└── types/
    └── next-auth.d.ts          # NextAuth type augmentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | สมัครสมาชิก |
| GET/POST | `/api/transactions` | ดึง/สร้างรายการ |
| DELETE | `/api/transactions/[id]` | ลบรายการ |
| GET/POST | `/api/credit-cards` | ดึง/สร้างบัตรเครดิต |
| DELETE | `/api/credit-cards/[id]` | ลบบัตรเครดิต |
| GET/POST | `/api/bills` | ดึง/สร้างบิล |
| PATCH/DELETE | `/api/bills/[id]` | อัปเดต/ลบบิล |
| GET/POST | `/api/tax-deductions` | ดึง/สร้างค่าลดหย่อน |
| DELETE | `/api/tax-deductions/[id]` | ลบค่าลดหย่อน |
| GET | `/api/dashboard?month=YYYY-MM` | ข้อมูลสรุป dashboard |
| GET | `/api/export?type=...` | Export Excel (.xlsx) |

## Design System

ใช้ CSS Custom Properties (design tokens) รองรับ light/dark theme:

- Brand accent: `#C45C4A` (warm terracotta)
- Semantic colors: success, warning, info, danger พร้อม bg/text pairs
- Apple HIG-inspired typography scale, spacing, border-radius
- Frosted glass topbar (`backdrop-blur`)
- Consistent card shadows, rounded corners (`rounded-xl`, `rounded-2xl`)

## License

MIT
