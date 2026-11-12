'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Shirt as Hanger,
  LayoutGrid,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  exampleOutfits,
  groups,
  samples,
  type ReviewScreen,
  type Sample,
} from './sample-data';

type PreviewState = 'populated' | 'empty' | 'loading' | 'error';
type Detail = Sample | 'signin' | null;

function Garment({
  tile,
  name,
  className = '',
}: {
  tile: number;
  name: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={name}
      className={`review-garment ${className}`}
      style={
        {
          '--sprite-x': `${((tile % 4) * 100) / 3}%`,
          '--sprite-y': `${Math.floor(tile / 4) * 100}%`,
        } as CSSProperties
      }
    />
  );
}

function Button({
  children,
  onClick,
  secondary = false,
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`review-button ${secondary ? 'secondary' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function DesignReview({ screen }: { screen: ReviewScreen }) {
  const [preview, setPreview] = useState<PreviewState>('populated');
  const [group, setGroup] = useState('All clothing');
  const [search, setSearch] = useState('');
  const [season, setSeason] = useState('Any');
  const [formality, setFormality] = useState('Any');
  const [selectedColor, setSelectedColor] = useState('Ivory');
  const [selection, setSelection] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<Detail>(null);
  const [more, setMore] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const openDetail = (value: Exclude<Detail, null>) => {
    opener.current = document.activeElement as HTMLElement;
    if (value !== 'signin') setSelectedColor(value.color);
    setDetail(value);
    dialog.current?.showModal();
  };
  const closeDetail = () => {
    dialog.current?.close();
    opener.current?.focus();
  };
  useEffect(() => {
    if (!detail) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.getElementById('review-detail-title')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detail]);
  const toggleSelection = (id: string) => {
    const item = samples.find((sample) => sample.id === id)!;
    setSelection((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setNotice(
      `${item.type} selection changed in this mockup only. Nothing is saved.`,
    );
  };
  const visibleSamples = samples.filter(
    (sample) =>
      (group === 'All clothing' || sample.group === group) &&
      `${sample.name} ${sample.type} ${sample.color}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const wardrobe = screen === 'wardrobe';
  const quickAdd = screen === 'quick-add';
  const isOutfits = screen === 'outfits';
  const visibleOutfits = exampleOutfits.filter((outfit) => {
    const hasJacket = outfit.items.some((item) => item === 7);
    const seasonMatches = season === 'Any' || outfit.season.includes(season);
    return (
      seasonMatches &&
      (!hasJacket || season === 'Autumn' || season === 'Winter') &&
      (formality === 'Any' || outfit.formality === formality)
    );
  });

  return (
    <>
      <aside className="review-toolbar" aria-label="Design review controls">
        <div className="review-toolbar-inner">
          <span>
            <span className="review-dot" />
            Design review{' '}
            <span className="review-toolbar-note">
              / Illustrative data · not saved
            </span>
          </span>
          <label>
            Preview state{' '}
            <select
              value={preview}
              onChange={(event) => {
                setPreview(event.target.value as PreviewState);
                setNotice('');
              }}
            >
              <option value="populated">Populated</option>
              <option value="empty">Empty</option>
              <option value="loading">Loading</option>
              <option value="error">Error</option>
            </select>
          </label>
        </div>
      </aside>
      <header className="review-header">
        <div className="review-shell review-header-inner">
          <Link
            href="/design-review/wardrobe"
            className="review-wordmark"
            aria-label="Stylist design review home"
          >
            STYLIST<span>.</span>
          </Link>
          <nav aria-label="Visitor navigation" className="review-desktop-nav">
            <Link
              href="/design-review/wardrobe"
              aria-current={wardrobe || quickAdd ? 'page' : undefined}
            >
              Wardrobe
            </Link>
            <Link
              href="/design-review/outfits"
              aria-current={isOutfits ? 'page' : undefined}
            >
              Outfits
            </Link>
          </nav>
          <button
            className="review-signin"
            onClick={() => openDetail('signin')}
          >
            Sign in <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="review-shell review-main"
      >
        {quickAdd && (
          <Link href="/design-review/wardrobe" className="review-back">
            <ArrowLeft aria-hidden="true" />
            Back to wardrobe
          </Link>
        )}
        <div className="review-page-heading">
          <div>
            <p className="review-eyebrow">
              {wardrobe
                ? 'Less searching. More wearing.'
                : quickAdd
                  ? 'Start with what you own'
                  : 'Good combinations, already in your closet.'}
            </p>
            <h1>
              {wardrobe
                ? 'Your wardrobe'
                : quickAdd
                  ? 'The everyday essentials'
                  : 'A little outfit inspiration'}
            </h1>
            <p className="review-intro">
              {wardrobe
                ? 'Good style starts with what’s already yours.'
                : quickAdd
                  ? 'Choose the clothes you own. Make the details your own.'
                  : 'Thoughtful pairings. Familiar pieces. One less decision.'}
            </p>
          </div>
          {wardrobe && (
            <Link href="/design-review/quick-add" className="review-button">
              <Plus aria-hidden="true" />
              Add clothing
            </Link>
          )}
          {quickAdd && (
            <span className="review-count-label">
              {selection.size === 0
                ? 'Choose your first piece'
                : `${selection.size} selected in this preview`}
            </span>
          )}
        </div>

        {wardrobe && (
          <div className="review-local-note">
            <span>
              <span className="review-note-mark">↳</span> Your visitor wardrobe
              stays in this browser.
            </span>
            <button onClick={() => openDetail('signin')}>
              Make it yours everywhere <ArrowRight aria-hidden="true" />
            </button>
          </div>
        )}
        {quickAdd && (
          <p className="review-catalog-note">
            <CircleAlert aria-hidden="true" />
            Illustrative sample images, not photos of your clothes. No shopping,
            just your own wardrobe.
          </p>
        )}

        {!isOutfits && (
          <div className="review-browse-tools">
            <div
              className="review-category-list"
              aria-label="Filter clothing group"
            >
              {groups.map((value) => (
                <button
                  key={value}
                  aria-pressed={group === value}
                  onClick={() => setGroup(value)}
                >
                  {value}
                  {wardrobe && (
                    <span>
                      {value === 'All clothing'
                        ? samples.length
                        : samples.filter((item) => item.group === value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <label className="review-search">
              <Search aria-hidden="true" />
              <span className="sr-only">Search clothing</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={wardrobe ? 'Find a piece…' : 'Find an essential…'}
              />
            </label>
          </div>
        )}

        {isOutfits && (
          <div className="review-outfit-filters">
            <div className="review-filter-intro">
              <SlidersHorizontal aria-hidden="true" />
              <span>A starting point for your day</span>
            </div>
            <div className="review-filter-fields">
              <label>
                Season
                <select
                  value={season}
                  onChange={(event) => setSeason(event.target.value)}
                >
                  {['Any', 'Spring', 'Summer', 'Autumn', 'Winter'].map(
                    (value) => (
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Formality
                <select
                  value={formality}
                  onChange={(event) => setFormality(event.target.value)}
                >
                  {['Any', 'Casual', 'Smart-casual', 'Formal'].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <Button
                onClick={() => {
                  setNotice(
                    'Showing hand-composed examples for design review. Filters do not run a matching engine yet.',
                  );
                  setMore(false);
                }}
              >
                <Sparkles aria-hidden="true" />
                Suggest outfits
              </Button>
            </div>
          </div>
        )}

        {notice && (
          <p className="review-notice" role="status">
            {notice}
            <button aria-label="Dismiss message" onClick={() => setNotice('')}>
              <X aria-hidden="true" />
            </button>
          </p>
        )}

        {preview === 'loading' ? (
          <section aria-label="Loading preview" aria-busy="true">
            <p className="review-section-label" role="status">
              <LoaderCircle aria-hidden="true" />
              {isOutfits
                ? 'Finding combinations…'
                : 'Getting your pieces ready…'}{' '}
              <span>Illustrative loading state</span>
            </p>
            <div
              className={
                isOutfits ? 'review-outfit-grid' : 'review-clothing-grid'
              }
            >
              {Array.from({ length: isOutfits ? 2 : 4 }, (_, index) => (
                <div className="review-skeleton" aria-hidden="true" key={index}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          </section>
        ) : preview === 'error' ? (
          <div className="review-empty" role="alert">
            <CircleAlert aria-hidden="true" />
            <p className="review-eyebrow">A small interruption</p>
            <h2>
              {isOutfits
                ? 'Your outfits couldn’t load.'
                : 'Your clothing couldn’t load.'}
            </h2>
            <p>Your choices haven’t changed. Let’s try that again.</p>
            <Button onClick={() => setPreview('populated')}>
              Retry preview <ArrowRight aria-hidden="true" />
            </Button>
            <small>Simulated error for design review</small>
          </div>
        ) : preview === 'empty' ? (
          <div className="review-empty">
            <Hanger aria-hidden="true" />
            <p className="review-eyebrow">A little beginning</p>
            <h2>
              {isOutfits
                ? 'An outfit starts with three pieces.'
                : quickAdd
                  ? 'No pieces selected. No rush.'
                  : 'Make room for what you love wearing.'}
            </h2>
            <p>
              {isOutfits
                ? 'Add a top, a bottom and a pair of shoes to see combinations. Jackets are always optional.'
                : 'Start with a few everyday essentials you already own. We’ll take it from there.'}
            </p>
            {quickAdd ? (
              <Button onClick={() => setPreview('populated')}>
                Browse essentials
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Link href="/design-review/quick-add" className="review-button">
                Choose your first pieces
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : isOutfits ? (
          <section aria-labelledby="review-outfit-results">
            <div className="review-section-label">
              <span id="review-outfit-results">
                {more
                  ? visibleOutfits.length
                  : Math.min(2, visibleOutfits.length)}{' '}
                example outfits{' '}
                <span className="review-muted">/ hand-composed for review</span>
              </span>
              <span>Made from the sample wardrobe</span>
            </div>
            <div className="review-outfit-grid">
              {visibleOutfits
                .slice(0, more ? visibleOutfits.length : 2)
                .map((outfit, index) => (
                  <article className="review-outfit-card" key={outfit.title}>
                    <div className="review-composition">
                      <span className="review-outfit-index">0{index + 1}</span>
                      <div className="review-composition-top">
                        <Garment
                          tile={samples[outfit.items[0]].tile}
                          name={samples[outfit.items[0]].name}
                        />
                      </div>
                      <div className="review-composition-bottom">
                        <Garment
                          tile={samples[outfit.items[1]].tile}
                          name={samples[outfit.items[1]].name}
                        />
                      </div>
                      <div className="review-composition-shoes">
                        <Garment tile={6} name="Off-white sneakers" />
                      </div>
                      {outfit.items.length > 3 && (
                        <div className="review-composition-jacket">
                          <Garment tile={7} name="Olive jacket" />
                        </div>
                      )}
                      <span className="review-composition-caption">
                        A combination to come back to.
                      </span>
                    </div>
                    <div className="review-outfit-description">
                      <div className="review-outfit-title">
                        <h2>{outfit.title}</h2>
                        <span>{outfit.formality}</span>
                      </div>
                      <p>{outfit.reason}</p>
                      <details>
                        <summary>
                          Inside this outfit <ChevronDown aria-hidden="true" />
                        </summary>
                        <ul>
                          {outfit.items.map((item) => (
                            <li key={item}>
                              {samples[item].color}{' '}
                              {samples[item].type.toLowerCase()}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  </article>
                ))}
            </div>
            {visibleOutfits.length === 0 && (
              <div className="review-empty">
                <SlidersHorizontal aria-hidden="true" />
                <h2>No examples for these filters.</h2>
                <p>
                  This review has a small set of hand-composed outfits. Try Any
                  to see them again.
                </p>
                <Button
                  secondary
                  onClick={() => {
                    setSeason('Any');
                    setFormality('Any');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {!more && visibleOutfits.length > 2 && (
              <div className="review-more">
                <Button secondary onClick={() => setMore(true)}>
                  Show more examples <ArrowDown aria-hidden="true" />
                </Button>
                <p>These are design examples, not generated recommendations.</p>
              </div>
            )}
            <div className="review-account-note">
              <span>
                <strong>A wardrobe that knows you.</strong>
                <br />
                Save outfits you love and track what you wear with an account.
              </span>
              <button onClick={() => openDetail('signin')}>
                Create account <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : (
          <section
            aria-label={
              quickAdd ? 'Sample quick-add catalog' : 'Sample wardrobe'
            }
          >
            <div className="review-section-label">
              <span>
                {quickAdd
                  ? 'A few good basics'
                  : `${visibleSamples.length} pieces, plenty of possibility`}
              </span>
              <span>
                {quickAdd ? (
                  'Pick a piece. Choose a color.'
                ) : (
                  <>
                    <LayoutGrid aria-hidden="true" /> Sample wardrobe
                  </>
                )}
              </span>
            </div>
            {visibleSamples.length === 0 ? (
              <div className="review-empty">
                <Search aria-hidden="true" />
                <h2>No pieces found.</h2>
                <p>Try a different search or clear your filters.</p>
                <Button
                  secondary
                  onClick={() => {
                    setSearch('');
                    setGroup('All clothing');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="review-clothing-grid">
                {visibleSamples.map((item) => (
                  <article className="review-clothing-card" key={item.id}>
                    <div className="review-clothing-media">
                      <button
                        className="review-image-button"
                        onClick={() => openDetail(item)}
                        aria-label={`View ${item.color} ${item.type}`}
                      >
                        <Garment
                          tile={item.tile}
                          name={`${item.color} ${item.type}`}
                        />
                      </button>
                      <span className="review-sample-label">
                        Illustrative sample
                      </span>
                      {!quickAdd && (
                        <button
                          className="review-card-menu"
                          aria-label={`Details for ${item.color} ${item.type}`}
                          onClick={() => openDetail(item)}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <div className="review-card-heading">
                      <h2>{quickAdd ? item.type : item.name}</h2>
                      <span
                        className="review-color-dot"
                        style={{ background: item.hex }}
                        aria-label={item.color}
                        role="img"
                      />
                    </div>
                    <p className="review-card-meta">
                      {item.color} <span>·</span>{' '}
                      {quickAdd ? item.formality : item.type}
                    </p>
                    {quickAdd && (
                      <div className="review-quick-actions">
                        <button
                          className={`review-add-choice ${selection.has(item.id) ? 'selected' : ''}`}
                          aria-pressed={selection.has(item.id)}
                          onClick={() => toggleSelection(item.id)}
                        >
                          {selection.has(item.id) ? (
                            <Check aria-hidden="true" />
                          ) : (
                            <Plus aria-hidden="true" />
                          )}
                          {selection.has(item.id) ? 'Selected' : 'I own this'}
                        </button>
                        <button
                          className="review-customize"
                          onClick={() => openDetail(item)}
                        >
                          Customize <ArrowRight aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                {wardrobe && (
                  <Link
                    href="/design-review/quick-add"
                    className="review-add-card"
                  >
                    <span>
                      <Plus aria-hidden="true" />
                    </span>
                    <strong>Something else in your closet?</strong>
                    <span>Add another piece</span>
                  </Link>
                )}
              </div>
            )}
            {quickAdd && (
              <div className="review-catalog-footer">
                <span>Only add what’s already in your wardrobe.</span>
                <Link href="/design-review/wardrobe" className="review-button">
                  Back to wardrobe preview
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        )}
        <footer className="review-footer">
          <span>Fewer new things. More new combinations.</span>
          <span>
            STYLIST. <span className="review-muted">/ Design concept 01</span>
          </span>
        </footer>
      </main>
      <nav className="review-mobile-nav" aria-label="Mobile visitor navigation">
        <Link
          href="/design-review/wardrobe"
          aria-current={wardrobe || quickAdd ? 'page' : undefined}
        >
          <Hanger aria-hidden="true" />
          Wardrobe
        </Link>
        <Link
          href="/design-review/outfits"
          aria-current={isOutfits ? 'page' : undefined}
        >
          <LayoutGrid aria-hidden="true" />
          Outfits
        </Link>
        <button onClick={() => openDetail('signin')}>
          <ArrowRight aria-hidden="true" />
          Sign in
        </button>
      </nav>
      <dialog
        ref={dialog}
        className="review-detail"
        aria-labelledby="review-detail-title"
        onClose={() => {
          setDetail(null);
          opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDetail();
        }}
      >
        <div className="review-detail-header">
          <span>
            {detail === 'signin'
              ? 'A place for your wardrobe'
              : 'Make it your own'}
          </span>
          <button aria-label="Close preview" onClick={closeDetail}>
            <X aria-hidden="true" />
          </button>
        </div>
        {detail === 'signin' ? (
          <div className="review-detail-body">
            <h2 id="review-detail-title" tabIndex={-1}>
              Your wardrobe, everywhere.
            </h2>
            <p>
              An account will let you sync your clothing, add personal photos
              and keep your favorite outfits.
            </p>
            <div className="review-inline-note">
              Sign-in is not connected in this design review. No account is
              created.
            </div>
            <Button onClick={closeDetail}>Back to the preview</Button>
          </div>
        ) : (
          detail && (
            <>
              <div className="review-detail-body">
                <p className="review-eyebrow">
                  {detail.group} / {detail.type}
                </p>
                <h2 id="review-detail-title" tabIndex={-1}>
                  {detail.name}
                </h2>
                <div className="review-detail-image">
                  <Garment
                    tile={detail.tile}
                    name={`${detail.color} ${detail.type}`}
                  />
                </div>
                <p className="review-card-meta">
                  Illustrative sample · Representative image
                </p>
                <p className="review-field-label">
                  Color <span>{selectedColor}</span>
                </p>
                <div
                  className="review-swatch-list"
                  role="group"
                  aria-label="Example color options"
                >
                  {['Ivory', 'Navy', 'Light blue', 'Oatmeal'].map(
                    (color, index) => (
                      <button
                        key={color}
                        className={selectedColor === color ? 'is-selected' : ''}
                        aria-label={color}
                        aria-pressed={selectedColor === color}
                        onClick={() => setSelectedColor(color)}
                      >
                        <span style={{ background: samples[index].hex }} />
                        {selectedColor === color && (
                          <Check aria-hidden="true" />
                        )}
                      </button>
                    ),
                  )}
                </div>
                <p className="review-help">
                  Representative image stays the same. Color choices are
                  illustrative only.
                </p>
                <label className="review-field-label">
                  Formality
                  <select defaultValue={detail.formality}>
                    <option>Casual</option>
                    <option>Smart-casual</option>
                    <option>Formal</option>
                  </select>
                </label>
                <fieldset className="review-season-options">
                  <legend>Seasons</legend>
                  {['Spring', 'Summer', 'Autumn', 'Winter'].map((value) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        defaultChecked={
                          value === 'Spring' || value === 'Summer'
                        }
                      />
                      {value}
                    </label>
                  ))}
                </fieldset>
                <details className="review-customization">
                  <summary>
                    Customize the details <ChevronDown aria-hidden="true" />
                  </summary>
                  <p className="review-help">
                    Examples for design review; exact per-type options will be
                    configured with the catalog.
                  </p>
                  {detail.type === 'T-shirt' ||
                  detail.type === 'Shirt' ||
                  detail.type === 'Sweater' ? (
                    <>
                      <label className="review-field-label">
                        Neckline / collar
                        <select>
                          <option>Crew neck</option>
                          <option>V-neck</option>
                          <option>Collared</option>
                        </select>
                      </label>
                      <label className="review-field-label">
                        Sleeves
                        <select>
                          <option>Short sleeves</option>
                          <option>Long sleeves</option>
                          <option>Sleeveless</option>
                        </select>
                      </label>
                    </>
                  ) : null}
                  <label className="review-field-label">
                    Pattern
                    <select>
                      <option>Solid</option>
                      <option>Striped</option>
                      <option>Checked</option>
                      <option>Printed</option>
                    </select>
                  </label>
                </details>
                <p className="review-inline-note">
                  Design preview only. Details are not saved, and do not change
                  the sample image.
                </p>
              </div>
              <div className="review-detail-footer">
                <Button secondary onClick={closeDetail}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setNotice('Preview reviewed. No wardrobe data was saved.');
                    closeDetail();
                  }}
                >
                  Done reviewing <Check aria-hidden="true" />
                </Button>
              </div>
            </>
          )
        )}
      </dialog>
    </>
  );
}
