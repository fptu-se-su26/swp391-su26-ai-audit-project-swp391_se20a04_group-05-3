import './globals.css';
import { ReactNode } from 'react';
import { StoreProvider } from '@/context/StoreContext';

export const metadata = {
  title: 'GreenLife',
  description: 'Dịch vụ cây cảnh và chăm sóc cây xanh',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
