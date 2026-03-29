import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // transactions | credit-cards | bills | tax-deductions

  if (!type) {
    return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
  }

  const wb = XLSX.utils.book_new();

  switch (type) {
    case "transactions": {
      const month = searchParams.get("month");
      const filterType = searchParams.get("filterType");
      const filterChannel = searchParams.get("filterChannel");
      const filterCategory = searchParams.get("filterCategory");

      const where: Record<string, unknown> = { userId: result.userId };
      if (filterType) where.type = filterType;
      if (filterChannel) where.channel = filterChannel;
      if (filterCategory) where.category = filterCategory;
      if (month) {
        const [y, m] = month.split("-").map(Number);
        where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
      }

      const rows = await prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        include: { creditCard: { select: { bankName: true, cardNumber: true } } },
      });

      const data = rows.map((r) => ({
        "วันที่": new Date(r.date).toLocaleDateString("th-TH"),
        "ประเภท": r.type === "income" ? "รายรับ" : "รายจ่าย",
        "หมวดหมู่": r.category,
        "ช่องทาง": r.channel === "cash" ? "เงินสด" : r.channel === "transfer" ? "โอนเงิน" : "บัตรเครดิต",
        "บัตรเครดิต": r.creditCard ? `${r.creditCard.bankName} *${r.creditCard.cardNumber}` : "-",
        "จำนวน (บาท)": r.amount,
        "หมายเหตุ": r.note || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, ws, "รายรับ-รายจ่าย");
      break;
    }

    case "credit-cards": {
      const rows = await prisma.creditCard.findMany({
        where: { userId: result.userId },
        orderBy: { createdAt: "desc" },
      });

      const data = rows.map((r) => ({
        "ธนาคาร": r.bankName,
        "เลขบัตร (4 หลัก)": r.cardNumber,
        "วงเงิน (บาท)": r.creditLimit,
        "ยอดค้างชำระ (บาท)": r.balance,
        "คงเหลือ (บาท)": r.creditLimit - r.balance,
        "ใช้ไป (%)": r.creditLimit > 0 ? Math.round((r.balance / r.creditLimit) * 100) : 0,
        "ครบกำหนดวันที่": r.dueDate,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws, "บัตรเครดิต");
      break;
    }

    case "bills": {
      const rows = await prisma.bill.findMany({
        where: { userId: result.userId },
        orderBy: { dueDay: "asc" },
      });

      const data = rows.map((r) => ({
        "รายการ": r.name,
        "จำนวน (บาท)": r.amount,
        "วันครบกำหนด": `วันที่ ${r.dueDay}`,
        "สถานะ": r.isPaid ? "ชำระแล้ว" : "ยังไม่ชำระ",
        "วันที่ชำระ": r.paidAt ? new Date(r.paidAt).toLocaleDateString("th-TH") : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "บิลประจำ");
      break;
    }

    case "tax-deductions": {
      const rows = await prisma.taxDeduction.findMany({
        where: { userId: result.userId },
        orderBy: { createdAt: "desc" },
      });

      const data = rows.map((r) => ({
        "ประเภท": r.category,
        "ชื่อรายการ": r.name,
        "จำนวน (บาท)": r.amount,
        "สูงสุด (บาท)": r.maxLimit,
        "ใช้ได้จริง (บาท)": Math.min(r.amount, r.maxLimit),
        "ปีภาษี": r.taxYear,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [{ wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, "ค่าลดหย่อน");
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `moneywise-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
