import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { WorkspaceGate } from '@/features/account/workspace-gate';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <WorkspaceGate>{children}</WorkspaceGate>
    </AppShell>
  );
}
