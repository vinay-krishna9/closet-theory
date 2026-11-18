import { QuickAdd } from '@/features/onboarding/quick-add';
import { groups } from '@/features/onboarding/catalog';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ group?: string | string[] }>;
}) {
  const { group } = await searchParams;
  const initialGroup =
    groups.find((value) => value === group) ?? 'All clothing';
  return <QuickAdd key={initialGroup} initialGroup={initialGroup} />;
}
