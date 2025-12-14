import type { Metadata } from 'next';
import { poppins } from '@/lib/fonts';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export const metadata: Metadata = {
  title: 'Renta',
  description: 'Renta - Property Management Made Simple for Rwandan Landlords',
  keywords: 'renta, property management, landlord, rwanda, rent collection',
  authors: [{ name: 'Renta' }],
  openGraph: {
    title: 'Renta',
    description: 'Renta - Property Management Made Simple for Rwandan Landlords',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${poppins.variable} font-poppins antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
