import { notFound } from 'next/navigation';
import { DesignReview } from '@/features/design-review/design-review';

export function generateStaticParams() {
  return ['wardrobe', 'quick-add', 'outfits'].map((screen) => ({ screen }));
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  if (screen !== 'wardrobe' && screen !== 'quick-add' && screen !== 'outfits')
    notFound();
  return <DesignReview key={screen} screen={screen} />;
}
