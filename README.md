# MoneyWise - ระบบจัดการเงินส่วนบุคคล

ระบบจัดการการเงินส่วนบุคคลแบบครบวงจร รองรับการบันทึกรายรับ-รายจ่าย, จัดการบัตรเครดิต, ติดตามบิลประจำ และคำนวณภาษีเงินได้บุคคลธรรมดา (ปีภาษี 2568)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite (via Prisma ORM)
- **Authentication:** NextAuth.js v5 (Credentials provider, JWT strategy)
- **Runtime:** React 19

## ฟีเจอร์หลัก

### Dashboard
- สรุปรายรับ-รายจ่ายรายเดือน
- กราฟแท่งแยกตามหมวดหมู่ (รายรับ/รายจ่าย)
- แจ้งเตือนบิลที่ใกล้ครบกำหนด
- รายการธุรกรรมล่าสุด

### รายรับ-รายจ่าย
- บันทึกรายการรายรับ/รายจ่าย พร้อมหมวดหมู่ (อาหาร, เดินทาง, เงินเดือน, ฟรีแลนซ์ ฯลฯ)
- รองรับช่องทางชำระ: เงินสด, โอนเงิน, บัตรเครดิต
- เชื่อมโยงรายจ่ายกับบัตรเครดิตได้
- ฟิลเตอร์ตามประเภท, ช่องทาง, หมวดหมู่ และเดือน

### บัตรเครดิต & หนี้สิน
- เพิ่ม/ลบบัตรเครดิต (เก็บเฉพาะ 4 หลักสุดท้าย)
- แสดงวงเงิน, ยอดค้างชำระ และ % การใช้งาน
- ตารางสรุปหนี้สินรวมทุกบัตร

### บิล & การแจ้งเตือน
- บันทึกบิลประจำ (ค่าน้ำ, ค่าไฟ, ค่าเช่า ฯลฯ)
- ติดตามสถานะชำระ/ยังไม่ชำระ
- แจ้งเตือนบิลที่ใกล้ครบกำหนดภายใน 7 วัน

### ภาษี & ลดหย่อน
- คำนวณภาษีเงินได้บุคคลธรรมดาแบบขั้นบันได (อัตราปี 2568)
- ค่าลดหย่อนอัตโนมัติ: ส่วนตัว 60,000 บาท + ค่าใช้จ่าย 50% (สูงสุด 100,000 บาท)
- บันทึกรายการลดหย่อนเพิ่มเติม 23+ ประเภท (ประกันชีวิต, RMF, SSF, Thai ESG, ดอกเบี้ยบ้าน ฯลฯ)
- แสดงตารางอัตราภาษีแบบขั้นบันไดเป็นข้อมูลอ้างอิง

## เริ่มต้นใช้งาน

### ความต้องการ
- Node.js 18+
- npm

### ติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# สร้างฐานข้อมูลและ migrate
npx prisma migrate dev

# รันเซิร์ฟเวอร์
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## โครงสร้างโปรเจกต์

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
│   │   └── tax-deductions/     # CRUD ค่าลดหย่อน
│   ├── login/                  # หน้า Login/Register
│   └── layout.tsx              # Root layout
├── components/
│   ├── SessionProvider.tsx     # NextAuth session provider
│   ├── Sidebar.tsx             # เมนูด้านซ้าย
│   └── Topbar.tsx              # แถบด้านบน
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client
│   ├── api-helpers.ts          # API utility functions
│   └── constants.ts            # หมวดหมู่, อัตราภาษี, formatters
└── types/
    └── next-auth.d.ts          # NextAuth type augmentation
```

## API Endpoints

| Method | Endpoint | รายละเอียด |
|--------|----------|------------|
| POST | `/api/register` | สมัครสมาชิก |
| GET/POST | `/api/transactions` | ดึง/สร้างรายการ |
| DELETE | `/api/transactions/[id]` | ลบรายการ |
| GET/POST | `/api/credit-cards` | ดึง/สร้างบัตรเครดิต |
| DELETE | `/api/credit-cards/[id]` | ลบบัตรเครดิต |
| GET/POST | `/api/bills` | ดึง/สร้างบิล |
| PATCH/DELETE | `/api/bills/[id]` | อัปเดต/ลบบิล |
| GET/POST | `/api/tax-deductions` | ดึง/สร้างค่าลดหย่อน |
| DELETE | `/api/tax-deductions/[id]` | ลบค่าลดหย่อน |
| GET | `/api/dashboard` | ข้อมูลสรุป dashboard |
