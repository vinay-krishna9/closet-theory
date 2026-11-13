'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  catalogImage,
  colors,
  getType,
  type ColorId,
  type TypeId,
} from '@/features/onboarding/catalog';

// Remount this component with a type/color key; stale loads cannot authorize Add.
export function GarmentPhoto({
  typeId,
  color,
  onReady,
  priority = false,
}: {
  typeId: TypeId;
  color: ColorId;
  onReady?: (ready: boolean) => void;
  priority?: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const label = `${colors[color].name} ${getType(typeId).name}, AI-generated sample`;
  return (
    <div className="garment-photo" aria-busy={status === 'loading'}>
      {status === 'error' ? (
        <div className="garment-photo-error">
          <Icon icon={ImageOff} />
          <p>Photo unavailable</p>
          <Button
            variant="outline"
            onClick={() => {
              setAttempt((n) => n + 1);
              setStatus('loading');
              onReady?.(false);
            }}
          >
            Retry photo
          </Button>
        </div>
      ) : (
        <>
          <Image
            key={attempt}
            src={catalogImage(typeId, color)}
            alt={label}
            fill
            sizes="(max-width: 359px) calc(100vw - 32px), (max-width: 767px) calc((100vw - 48px) / 2), (max-width: 1279px) 30vw, 300px"
            priority={priority}
            onLoad={() => {
              if (!live.current) return;
              setStatus('ready');
              onReady?.(true);
            }}
            onError={() => {
              if (!live.current) return;
              setStatus('error');
              onReady?.(false);
            }}
          />
          {status === 'loading' && (
            <span className="garment-photo-loading">Loading photo…</span>
          )}
        </>
      )}
    </div>
  );
}
