import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signals — Higher Ed Intelligence',
  description:
    'AI-curated decision briefs on accessibility, AI governance, accreditation, and student success — delivered weekly to academic administrators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen text-gray-900">
        <Nav />
        <main>{children}</main>
        <footer className="mt-20 border-t border-gray-100 py-10 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Signals — AI-generated decision briefs for higher education.
        </footer>
      </body>
    </html>
  );
}
