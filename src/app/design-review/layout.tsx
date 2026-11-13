import '@/features/design-review/review.css';

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="design-review">{children}</div>;
}
