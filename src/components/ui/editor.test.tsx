import { useState } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Editor } from './editor';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

function EditorFixture() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Navy shirt');
  return (
    <Editor open={open} onOpenChange={setOpen} dirty={name !== 'Navy shirt'}>
      <DialogTrigger asChild>
        <Button>Edit clothing</Button>
      </DialogTrigger>
      <DialogContent presentation="editor" showCloseButton={false}>
        <div className="editor-header">
          <DialogTitle asChild>
            <h2 tabIndex={-1} data-dialog-heading>
              Edit garment
            </h2>
          </DialogTitle>
        </div>
        <div className="editor-body">
          <DialogDescription>Review your garment details.</DialogDescription>
          <Label htmlFor="name">Garment name</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="editor-footer">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Editor>
  );
}

describe('shared editor dismissal', () => {
  it('opens with heading focus and closes a clean draft', async () => {
    render(<EditorFixture />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit clothing' }));
    expect(screen.getByRole('heading', { name: 'Edit garment' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit garment');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('preserves edits when dismissal is cancelled and discards only on explicit confirmation', async () => {
    render(<EditorFixture />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit clothing' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Garment name' }), {
      target: { value: 'Blue Oxford shirt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const confirmation = screen.getByRole('alertdialog', {
      name: 'Discard your changes?',
    });
    expect(
      within(confirmation).getByRole('button', { name: 'Keep editing' }),
    ).toHaveFocus();
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Keep editing' }),
    );
    expect(screen.getByRole('textbox', { name: 'Garment name' })).toHaveValue(
      'Blue Oxford shirt',
    );
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    });
    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
