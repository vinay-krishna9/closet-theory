import type { LucideIcon, LucideProps } from 'lucide-react';

export function Icon({
  icon: Glyph,
  navigation = false,
  ...props
}: LucideProps & {
  icon: LucideIcon;
  navigation?: boolean;
}) {
  return (
    <Glyph
      size={navigation ? 24 : 20}
      strokeWidth={1.75}
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}
