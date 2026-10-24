import { SerwistProvider } from '@serwist/turbopack/react';
export default function L({ children }: { children: React.ReactNode }) { return <SerwistProvider swUrl="/serwist/sw.js" register={false}>{children}</SerwistProvider>; }
