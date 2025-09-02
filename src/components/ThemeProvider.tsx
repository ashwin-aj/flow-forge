import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { state } = useApp();
  const { theme } = state;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <>
      {children}
    </>
  );
}