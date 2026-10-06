import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

// خط عربي واضح ومناسب للألعاب
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "نمط | Pattern",
  description: "لعبة ذكاء فردية لإكمال الأنماط المتسلسلة. 60 ثانية، ألغاز لا نهائية.",
};

// مهم للموبايل: منع التكبير غير المقصود أثناء الضغط السريع
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-slate-900 font-cairo text-slate-100 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}