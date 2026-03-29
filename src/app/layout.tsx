import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoneyWise - ระบบจัดการเงิน ภาษี บัตรเครดิต",
  description: "ระบบจัดการการเงินส่วนบุคคล ภาษี และบัตรเครดิต",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--light-bg)] text-[var(--dark-text)]">
        {children}
      </body>
    </html>
  );
}
