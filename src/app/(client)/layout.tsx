'use client';

import { PortalShell } from '@/components/auth/PortalShell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="client">{children}</PortalShell>;
}
