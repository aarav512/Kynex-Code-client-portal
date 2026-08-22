'use client';

import { PortalShell } from '@/components/auth/PortalShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="admin">{children}</PortalShell>;
}
