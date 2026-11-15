import { createElement } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { QuickAdd } from '@/features/onboarding/quick-add';
import { VisitorWardrobeProvider } from './visitor-provider';
import { Wardrobe } from './wardrobe';

vi.mock('next/image', () => ({
  default: ({
    fill,
    priority,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => {
    void fill;
    void priority;
    void sizes;
    return createElement('img', props);
  },
}));

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

function setup() {
  render(
    <VisitorWardrobeProvider>
      <QuickAdd />
      <Wardrobe />
    </VisitorWardrobeProvider>,
  );
}
function tee() {
  return screen.getByRole('article', { name: 'T-shirt catalog item' });
}
function loadEditor() {
  const dialog = screen.getByRole('dialog');
  fireEvent.load(within(dialog).getAllByRole('img')[0]);
  return dialog;
}

describe('visitor catalog interactions', () => {
  it('adds the default configuration from a card without color controls or accidental duplicates', () => {
    setup();
    const card = tee();
    expect(within(card).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(card).queryByRole('radio')).not.toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: 'I own this' }),
    ).toBeDisabled();
    fireEvent.load(within(card).getByRole('img'));
    const add = within(card).getByRole('button', { name: 'I own this' });
    fireEvent.click(add);
    fireEvent.click(add);
    expect(
      screen.getByRole('article', { name: 'White T-shirt' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(9);
    expect(
      within(card).getByRole('link', { name: 'In wardrobe' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Favorite' }),
    ).not.toBeInTheDocument();
  });
  it('chooses color in Customize and uses a loading skeleton through failure and retry', () => {
    setup();
    fireEvent.click(within(tee()).getByRole('button', { name: 'Customize' }));
    const dialog = loadEditor();
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Garment name' }),
      {
        target: { value: 'My navy tee' },
      },
    );
    fireEvent.click(within(dialog).getByRole('radio', { name: /^Navy$/ }));
    const add = within(dialog).getByRole('button', { name: 'Add to wardrobe' });
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Loading photo',
    );
    expect(add).toBeDisabled();
    fireEvent.error(within(dialog).getByRole('img'));
    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Photo unavailable')).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Retry photo' }),
    );
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'Loading photo',
    );
    expect(add).toBeDisabled();
    fireEvent.load(within(dialog).getByRole('img'));
    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
    expect(add).toBeEnabled();
    fireEvent.click(add);
    const item = screen.getByRole('article', { name: 'My navy tee' });
    expect(within(item).getByRole('img')).toHaveAttribute(
      'alt',
      expect.stringContaining('Navy T-shirt'),
    );
    expect(within(tee()).getByText(/White/)).toBeVisible();
  });
  it('retains invalid draft values, focuses the invalid field and preserves edits when dismissal is cancelled', async () => {
    setup();
    fireEvent.click(within(tee()).getByRole('button', { name: 'Customize' }));
    const dialog = loadEditor();
    const name = within(dialog).getByRole('textbox', { name: 'Garment name' });
    fireEvent.change(name, { target: { value: '' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add to wardrobe' }),
    );
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toHaveValue('');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(name, { target: { value: 'My everyday tee' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Close item editor' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('textbox', { name: 'Garment name' })).toHaveValue(
      'My everyday tee',
    );
  });
  it.each([
    { name: 'T-shirt', group: 'Tops' },
    { name: 'Sneakers', group: 'Shoes' },
  ])(
    'keeps catalog $name identity fixed while customizing and editing',
    ({ name, group }) => {
      setup();
      const card = screen.getByRole('article', {
        name: name + ' catalog item',
      });
      fireEvent.click(within(card).getByRole('button', { name: 'Customize' }));
      let dialog = loadEditor();
      const groupChoices = within(dialog).getByRole('group', {
        name: /^Group$/,
      });
      const typeChoices = within(dialog).getByRole('group', { name: /^Type$/ });
      expect(
        within(groupChoices).getByRole('radio', { name: group }),
      ).toBeChecked();
      expect(within(typeChoices).getByRole('radio', { name })).toBeChecked();
      for (const choice of [
        ...within(groupChoices).getAllByRole('radio'),
        ...within(typeChoices).getAllByRole('radio'),
      ])
        expect(choice).toBeDisabled();
      expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
      const season = within(dialog).getByRole('group', { name: /^Seasons/ });
      for (const label of ['Spring', 'Summer', 'Autumn', 'Winter'])
        fireEvent.click(within(season).getByRole('checkbox', { name: label }));
      fireEvent.click(within(season).getByRole('checkbox', { name: 'Winter' }));
      fireEvent.change(
        within(dialog).getByRole('textbox', { name: 'Garment name' }),
        { target: { value: 'My winter staple' } },
      );
      fireEvent.click(within(dialog).getByRole('radio', { name: /^Navy$/ }));
      fireEvent.load(within(dialog).getAllByRole('img')[0]);
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Add to wardrobe' }),
      );
      const saved = screen.getByRole('article', { name: 'My winter staple' });
      expect(within(saved).getByRole('img')).toHaveAttribute(
        'alt',
        expect.stringContaining('Navy ' + name),
      );
      fireEvent.click(
        within(saved).getByRole('button', { name: 'Edit clothing' }),
      );
      dialog = loadEditor();
      expect(
        within(dialog).getByRole('checkbox', { name: 'Winter' }),
      ).toBeChecked();
      expect(
        within(dialog).getByRole('radio', { name: /^Navy$/ }),
      ).toBeChecked();
      const savedType = within(
        within(dialog).getByRole('group', { name: /^Type$/ }),
      ).getByRole('radio', { name });
      expect(savedType).toBeChecked();
      expect(savedType).toBeDisabled();
    },
  );
  it('asks about similar clothing, keeps the existing entry and requires confirmation for a separate garment', () => {
    setup();
    const card = tee();
    fireEvent.load(within(card).getByRole('img'));
    fireEvent.click(within(card).getByRole('button', { name: 'I own this' }));
    fireEvent.click(
      within(card).getByRole('button', { name: 'Add another / customize' }),
    );
    let dialog = loadEditor();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add to wardrobe' }),
    );
    expect(
      within(dialog).getByRole('heading', {
        name: 'You may already have this',
      }),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Keep existing' }),
    );
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(9);
    fireEvent.click(
      within(card).getByRole('button', { name: 'Add another / customize' }),
    );
    dialog = loadEditor();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add to wardrobe' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Add as a different garment',
      }),
    );
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(9);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm separate garment' }),
    );
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(10);
  });
  it('requires explicit removal and leaves the catalog available', () => {
    setup();
    const card = tee();
    fireEvent.load(within(card).getByRole('img'));
    fireEvent.click(within(card).getByRole('button', { name: 'I own this' }));
    fireEvent.click(
      within(screen.getByRole('article', { name: 'White T-shirt' })).getByRole(
        'button',
        { name: /^Remove$/ },
      ),
    );
    expect(screen.getByRole('button', { name: 'Keep clothing' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Keep clothing' }));
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(9);
    fireEvent.click(
      within(screen.getByRole('article', { name: 'White T-shirt' })).getByRole(
        'button',
        { name: /^Remove$/ },
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove clothing' }));
    expect(screen.getAllByRole('article', { hidden: true })).toHaveLength(8);
    expect(
      within(card).getByRole('button', { name: 'I own this' }),
    ).toBeInTheDocument();
  });
});
