import { afterEach, expect, it } from 'vitest';
import {
  clearProfileDraft,
  readProfileDraft,
  saveProfileDraft,
} from './profile-draft';
afterEach(() => sessionStorage.clear());
it('restores a timezone draft only for its owner during reauthentication', () => {
  expect(saveProfileDraft('user_a', 'Europe/Berlin')).toBe(true);
  expect(readProfileDraft('user_a')).toBe('Europe/Berlin');
  expect(readProfileDraft('user_b')).toBeNull();
  expect(readProfileDraft('user_a')).toBeNull();
});
it('clears the reauthentication draft on explicit sign-out', () => {
  saveProfileDraft('user_a', 'UTC');
  clearProfileDraft();
  expect(readProfileDraft('user_a')).toBeNull();
});
