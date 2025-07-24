'use client';

import { ReactNode } from 'react';

interface JoyrideProviderProps {
  children: ReactNode;
}

// Temporary disabled Joyride for React 19 compatibility
// TODO: Replace with React 19 compatible tour library
export function JoyrideProvider({ children }: JoyrideProviderProps) {
  return <>{children}</>;
}
