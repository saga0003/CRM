import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admissions Command Center',
  description: 'Odoo-connected admissions CRM and analytics dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
