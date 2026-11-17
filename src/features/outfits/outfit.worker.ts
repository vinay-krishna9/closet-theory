import { generateOutfits } from '@/lib/outfits/engine';
import type { OutfitRequest } from '@/lib/outfits/types';
import { visitorResults, type VisitorResult } from './visitor-results';

export type GenerationRequest = { id: number; request: OutfitRequest };
export type GenerationResponse = { id: number; result: VisitorResult };

const scope = self as unknown as {
  onmessage: (event: MessageEvent<GenerationRequest>) => void;
  postMessage: (message: GenerationResponse) => void;
};
scope.onmessage = ({ data }) => {
  scope.postMessage({
    id: data.id,
    result: visitorResults(generateOutfits(data.request)),
  });
};
