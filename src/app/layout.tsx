import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Event Planner | Smart Budget & Timeline Scheduler',
  description: 'Smart event budgeting and timeline scheduling with dependency management.',
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
