'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { cleanPhoto, type CleanPhoto } from '@/lib/images/photo-browser';
import { removePhotoBackground } from './photo-processing';

export type PhotoChoice = 'original' | 'cutout';
type Review = {
  source: CleanPhoto | null;
  sourceUrl: string;
  cutout: Blob | null;
  cutoutUrl: string;
  choice: PhotoChoice | null;
  status: 'idle' | 'validating' | 'processing' | 'ready' | 'error';
  error: string;
};
const empty: Review = {
  source: null,
  sourceUrl: '',
  cutout: null,
  cutoutUrl: '',
  choice: null,
  status: 'idle',
  error: '',
};
const fallback =
  'We couldn’t remove the background. You can keep this photo or try again.';
export function usePhotoReview() {
  const [review, setReview] = useState<Review>(empty);
  const life = useRef({
    sequence: 0,
    alive: true,
    urls: new Set<string>(),
    cancel: () => {},
    cutoutUrl: '',
  });
  useLayoutEffect(() => {
    const owner = life.current;
    owner.alive = true;
    return () => {
      owner.alive = false;
      owner.sequence++;
      owner.cancel();
      for (const url of owner.urls) URL.revokeObjectURL(url);
      owner.urls.clear();
    };
  }, []);
  function invalidate() {
    const owner = life.current;
    owner.cancel();
    owner.cancel = () => {};
    return ++owner.sequence;
  }
  function url(blob: Blob) {
    const value = URL.createObjectURL(blob);
    life.current.urls.add(value);
    return value;
  }
  function release() {
    for (const value of life.current.urls) URL.revokeObjectURL(value);
    life.current.urls.clear();
    life.current.cutoutUrl = '';
  }
  function process(source: CleanPhoto, sequence: number) {
    setReview((previous) => ({
      ...previous,
      choice: null,
      status: 'processing',
      error: '',
    }));
    life.current.cancel = removePhotoBackground(
      source,
      (blob) => {
        if (!life.current.alive || sequence !== life.current.sequence) return;
        if (life.current.cutoutUrl) {
          URL.revokeObjectURL(life.current.cutoutUrl);
          life.current.urls.delete(life.current.cutoutUrl);
        }
        const cutoutUrl = url(blob);
        life.current.cutoutUrl = cutoutUrl;
        setReview((previous) => ({
          ...previous,
          cutout: blob,
          cutoutUrl,
          choice: 'cutout',
          status: 'ready',
          error: '',
        }));
      },
      () => {
        if (life.current.alive && sequence === life.current.sequence)
          setReview((previous) => ({
            ...previous,
            choice: null,
            status: 'error',
            error: fallback,
          }));
      },
    );
  }
  async function choose(file: File) {
    const sequence = invalidate();
    setReview((previous) => ({
      ...previous,
      choice: null,
      status: 'validating',
      error: '',
    }));
    try {
      const source = await cleanPhoto(file);
      if (!life.current.alive || sequence !== life.current.sequence) return;
      release();
      const sourceUrl = url(source.blob);
      setReview({ ...empty, source, sourceUrl });
      process(source, sequence);
    } catch (error) {
      if (life.current.alive && sequence === life.current.sequence)
        setReview((previous) => ({
          ...previous,
          choice: null,
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Could not read this photo. Choose another.',
        }));
    }
  }
  function retry() {
    if (review.source) process(review.source, invalidate());
  }
  function select(choice: PhotoChoice) {
    if (!review.source || (choice === 'cutout' && !review.cutout)) return;
    invalidate();
    setReview((previous) => ({
      ...previous,
      choice,
      status: 'ready',
      error: '',
    }));
  }
  function cancel() {
    invalidate();
    setReview((previous) => ({
      ...previous,
      choice: null,
      status: 'error',
      error:
        'Background removal cancelled. Retry or explicitly use the original.',
    }));
  }
  function reset() {
    invalidate();
    release();
    setReview(empty);
  }
  return {
    ...review,
    choose,
    retry,
    select,
    cancel,
    reset,
    selected:
      review.choice === 'cutout'
        ? review.cutout
        : review.choice === 'original'
          ? (review.source?.blob ?? null)
          : null,
  };
}
