import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const display = Inter({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Kynex Code — Client Portal',
  description: 'Premium client portal for project management, file delivery, and support.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
