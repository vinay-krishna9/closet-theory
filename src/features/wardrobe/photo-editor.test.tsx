import { createElement } from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { PhotoEditor } from './photo-editor';
const mocks = vi.hoisted(() => ({ jobs: [] as { fail: () => void }[] }));
vi.mock('@/lib/images/photo-browser', () => ({
  cleanPhoto: async () => ({
    blob: new Blob(['sanitized'], { type: 'image/png' }),
    pixels: new Uint8ClampedArray([1, 2, 3, 255]),
    width: 1,
    height: 1,
  }),
}));
vi.mock('./photo-processing', () => ({
  removePhotoBackground: (_: unknown, _success: unknown, fail: () => void) => {
    mocks.jobs.push({ fail });
    return vi.fn();
  },
}));
vi.mock('next/image', () => ({
  default: ({
    fill,
    sizes,
    unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    sizes?: string;
    unoptimized?: boolean;
  }) => {
    void fill;
    void sizes;
    void unoptimized;
    return createElement('img', props);
  },
}));
beforeEach(() => {
  mocks.jobs.length = 0;
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fixture');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
it('retains confirmed tags through removal/save failure and offers Add another only after confirmed success', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('Could not save. Retry safely.'))
    .mockResolvedValue(undefined);
  render(
    <PhotoEditor items={[]} opener={null} onClose={vi.fn()} onSave={save} />,
  );
  fireEvent.change(screen.getByLabelText('Choose a photo'), {
    target: {
      files: [new File(['photo'], 'garment.png', { type: 'image/png' })],
    },
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Tops' }));
  fireEvent.click(screen.getByRole('radio', { name: 'T-shirt' }));
  fireEvent.change(screen.getByLabelText('Garment name'), {
    target: { value: 'My real shirt' },
  });
  fireEvent.click(screen.getByRole('radio', { name: 'Casual' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Summer' }));
  await waitFor(() => expect(mocks.jobs).toHaveLength(1));
  act(() => mocks.jobs[0].fail());
  expect(screen.getByLabelText('Garment name')).toHaveValue('My real shirt');
  expect(screen.getByRole('button', { name: 'Save clothing' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Use original' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save clothing' }));
  await screen.findByText('Could not save. Retry safely.');
  expect(
    screen.queryByRole('button', { name: 'Add another' }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Garment name')).toHaveValue('My real shirt');
  expect(screen.getByRole('checkbox', { name: 'Summer' })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Save clothing' }));
  await screen.findByRole('button', { name: 'Add another' });
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0].operationId).toBe(
    save.mock.calls[0][0].operationId,
  );
  expect(save.mock.calls[1][0].variant).toBe('original');
  fireEvent.click(screen.getByRole('button', { name: 'Add another' }));
  expect(screen.getByLabelText('Choose a photo')).toBeInTheDocument();
  expect(screen.queryByLabelText('Garment name')).not.toBeInTheDocument();
});
