import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clearpoint Starter',
  description: 'Agent OS starter kit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
