import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'Arabic Bible Study — Admin Panel',
  description: 'Content Management System for the Arabic AVD Bible Study App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
