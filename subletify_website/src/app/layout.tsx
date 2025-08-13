// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from './components/NavBar';
import ClientProvider from './components/client-provider'; // Import ClientProvider



export const metadata: Metadata = {
  title: "Subletify",
  description: "Sublet apartments and sell furniture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{ backgroundColor: 'white' }}
        
      >
        {/* This is still server-side */}
        
        {/* Wrap all client-side components with ClientProvider */}
        <ClientProvider>
        <Navbar />
          <main>{children}</main>
        </ClientProvider>
      </body>
    </html>
  );
}
