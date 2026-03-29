// Transaction categories - used across the app
export const EXPENSE_CATEGORIES = [
  { value: "food", label: "อาหาร" },
  { value: "transport", label: "เดินทาง" },
  { value: "utilities", label: "ค่าน้ำ/ค่าไฟ" },
  { value: "rent", label: "ค่าเช่า" },
  { value: "phone", label: "ค่าโทรศัพท์" },
  { value: "internet", label: "ค่าอินเทอร์เน็ต" },
  { value: "shopping", label: "ช้อปปิ้ง" },
  { value: "health", label: "สุขภาพ" },
  { value: "entertainment", label: "บันเทิง" },
  { value: "education", label: "การศึกษา" },
  { value: "insurance", label: "ประกัน" },
  { value: "investment", label: "ลงทุน" },
  { value: "withholding_tax", label: "ภาษี ณ ที่จ่าย" },
  { value: "social_security_expense", label: "ประกันสังคม (หัก)" },
  { value: "provident_fund_expense", label: "กองทุนสำรองเลี้ยงชีพ (หัก)" },
  { value: "credit_card_payment", label: "ชำระหนี้บัตรเครดิต" },
  { value: "savings_deposit", label: "ฝากเงินออม" },
  { value: "investment_buy", label: "ซื้อลงทุน" },
  { value: "other_expense", label: "อื่นๆ" },
] as const;

export const INCOME_CATEGORIES = [
  { value: "salary", label: "เงินเดือน" },
  { value: "freelance", label: "ฟรีแลนซ์" },
  { value: "bonus", label: "โบนัส" },
  { value: "investment_return", label: "ผลตอบแทนลงทุน" },
  { value: "cashback", label: "Cashback บัตรเครดิต" },
  { value: "savings_withdraw", label: "ถอนเงินออม" },
  { value: "investment_sell", label: "ขายลงทุน" },
  { value: "other_income", label: "อื่นๆ" },
] as const;

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const CHANNELS = [
  { value: "cash", label: "เงินสด" },
  { value: "transfer", label: "โอนเงิน" },
  { value: "credit", label: "บัตรเครดิต" },
] as const;

export const INVESTMENT_TYPES = [
  { value: "gold", label: "ทองคำ" },
  { value: "stock", label: "หุ้น" },
  { value: "fund", label: "กองทุน" },
  { value: "crypto", label: "คริปโต" },
  { value: "bond", label: "พันธบัตร/ตราสารหนี้" },
  { value: "other", label: "อื่นๆ" },
] as const;

export const PHYSICAL_ASSET_TYPES = [
  { value: "gold", label: "ทองคำ" },
  { value: "property", label: "อสังหาริมทรัพย์" },
  { value: "vehicle", label: "ยานพาหนะ" },
  { value: "collectible", label: "ของสะสม" },
  { value: "other", label: "อื่นๆ" },
] as const;

export const CURRENCIES = [
  { value: "THB", label: "THB (บาท)", symbol: "฿" },
  { value: "USD", label: "USD (ดอลลาร์)", symbol: "$" },
  { value: "EUR", label: "EUR (ยูโร)", symbol: "€" },
  { value: "JPY", label: "JPY (เยน)", symbol: "¥" },
  { value: "CNY", label: "CNY (หยวน)", symbol: "¥" },
  { value: "GBP", label: "GBP (ปอนด์)", symbol: "£" },
  { value: "SGD", label: "SGD (สิงคโปร์)", symbol: "S$" },
] as const;

// Thai tax deduction categories for year 2568
export const TAX_DEDUCTION_CATEGORIES = [
  { value: "personal", label: "ค่าลดหย่อนส่วนตัว", maxLimit: 60000 },
  { value: "spouse", label: "คู่สมรส (ไม่มีรายได้)", maxLimit: 60000 },
  { value: "child", label: "บุตร (คนละ)", maxLimit: 30000 },
  { value: "parent", label: "บิดามารดา (คนละ)", maxLimit: 30000 },
  { value: "disability", label: "อุปการะคนพิการ", maxLimit: 60000 },
  { value: "prenatal", label: "ค่าฝากครรภ์/คลอดบุตร", maxLimit: 60000 },
  { value: "life_insurance", label: "ประกันชีวิต", maxLimit: 100000 },
  { value: "health_insurance", label: "ประกันสุขภาพ", maxLimit: 25000 },
  { value: "parent_health_insurance", label: "ประกันสุขภาพบิดามารดา", maxLimit: 15000 },
  { value: "social_security", label: "ประกันสังคม", maxLimit: 9000 },
  { value: "provident_fund", label: "กองทุนสำรองเลี้ยงชีพ", maxLimit: 10000 },
  { value: "gpf", label: "กบข.", maxLimit: 500000 },
  { value: "rmf", label: "กองทุน RMF", maxLimit: 500000 },
  { value: "ssf", label: "กองทุน SSF", maxLimit: 200000 },
  { value: "thaiesg", label: "กองทุน Thai ESG", maxLimit: 300000 },
  { value: "pension_insurance", label: "ประกันบำนาญ", maxLimit: 200000 },
  { value: "mortgage", label: "ดอกเบี้ยบ้าน", maxLimit: 100000 },
  { value: "new_home", label: "บ้านหลังแรก (2568)", maxLimit: 100000 },
  { value: "donation_education", label: "บริจาคการศึกษา (2 เท่า)", maxLimit: 100000 },
  { value: "donation_general", label: "บริจาคทั่วไป", maxLimit: 100000 },
  { value: "donation_political", label: "บริจาคพรรคการเมือง", maxLimit: 10000 },
  { value: "easy_ereceipt", label: "Easy E-Receipt", maxLimit: 50000 },
  { value: "local_travel", label: "ท่องเที่ยวไทย", maxLimit: 15000 },
] as const;

// Format number as Thai Baht
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get category label from value
export function getCategoryLabel(value: string): string {
  const found = ALL_CATEGORIES.find((c) => c.value === value);
  return found?.label || value;
}

// Get channel label from value
export function getChannelLabel(value: string): string {
  const found = CHANNELS.find((c) => c.value === value);
  return found?.label || value;
}

export function getInvestmentTypeLabel(value: string): string {
  const found = INVESTMENT_TYPES.find((c) => c.value === value);
  return found?.label || value;
}

export function getPhysicalAssetTypeLabel(value: string): string {
  const found = PHYSICAL_ASSET_TYPES.find((c) => c.value === value);
  return found?.label || value;
}

// Calculate Thai personal income tax (progressive rates for 2568)
export function calculateTax(netIncome: number): number {
  if (netIncome <= 0) return 0;

  const brackets = [
    { limit: 150000, rate: 0 },
    { limit: 300000, rate: 0.05 },
    { limit: 500000, rate: 0.1 },
    { limit: 750000, rate: 0.15 },
    { limit: 1000000, rate: 0.2 },
    { limit: 2000000, rate: 0.25 },
    { limit: 5000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];

  let tax = 0;
  let previousLimit = 0;

  for (const bracket of brackets) {
    if (netIncome <= previousLimit) break;
    const taxableInBracket =
      Math.min(netIncome, bracket.limit) - previousLimit;
    tax += taxableInBracket * bracket.rate;
    previousLimit = bracket.limit;
  }

  return tax;
}
