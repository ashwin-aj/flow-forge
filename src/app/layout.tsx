'use client';

import { Inter } from 'next/font/google';
import { AppProvider } from '../context/AppContext';
import ThemeProvider from '../components/ThemeProvider';
import '../styles/globals.css';
import '../styles/animations.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Orkestra: End-to-End Test Automation Pipeline Orchestration Platform</title>
        <meta name="description" content="End-to-End Test Automation Pipeline Orchestration Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AppProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}