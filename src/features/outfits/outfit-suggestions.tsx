'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { OutfitFilters } from '@/lib/outfits/types';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { AccountAccess } from '@/components/account-access';
import { useAccount } from '@/features/account/runtime';
import {
  PictorialOptions,
  anyChoice,
  seasonChoices,
  formalityChoices,
} from '@/components/ui/pictorial-options';
import { useWardrobe } from '@/features/wardrobe/account-provider';
import {
  WardrobeDataNotice,
  WardrobeLoading,
  WardrobeUnavailable,
} from '@/features/wardrobe/data-notice';
import {
  VisitorRestoring,
  VisitorStorageNotice,
} from '@/features/wardrobe/visitor-storage-notice';
import { OutfitCard } from './outfit-card';
import { useSuggestions } from './use-suggestions';
import { useAccountSuggestions } from './use-account-suggestions';

const anyFilters: OutfitFilters = { season: 'Any', formality: 'Any' };
const outcomeAnnouncements = {
  results: 'Suggestions are ready.',
  'missing-groups':
    'Some required clothing groups are missing. Add the missing pieces to continue.',
  'filtered-groups':
    'These filters exclude a required clothing group. Adjust your filters or try Any.',
  'no-compatible-outfits':
    'No compatible outfits match these filters. Review your filters or clothing tags.',
  'hidden-disliked': 'No visible suggestions match these filters.',
  'search-limited': 'This search reached its limit. Try more specific filters.',
};

export function OutfitSuggestions() {
  const account = useAccount();
  const { items, persistence, mode, loaded, loadError } = useWardrobe();
  const isAccount = mode === 'account';
  const [filters, setFilters] = useState<OutfitFilters>(anyFilters);
  const [expanded, setExpanded] = useState(false);
  const panel = useId();
  const filtersButton = useRef<HTMLButtonElement>(null);
  const appendedStart = useRef<number | null>(null);
  const visitor = useSuggestions(items, filters);
  const saved = useAccountSuggestions(
    items,
    filters,
    isAccount ? account.userId : null,
    !loaded || !!loadError,
  );
  const { suggest, status, result } = isAccount ? saved : visitor;
  useEffect(() => {
    if (!saved.result) {
      appendedStart.current = null;
      return;
    }
    if (
      saved.status === 'success' &&
      appendedStart.current !== null &&
      saved.result.candidates.length > appendedStart.current
    ) {
      document
        .querySelectorAll<HTMLElement>('.outfit-card h2')
        [appendedStart.current]?.focus();
      appendedStart.current = null;
    }
  }, [saved.result, saved.status]);
  if (persistence === 'loading')
    return isAccount ? <WardrobeLoading /> : <VisitorRestoring />;
  if (isAccount && !loaded && loadError) return <WardrobeUnavailable />;
  const successful = result?.ok ? result : null;
  const byId = new Map(
    (isAccount && saved.result ? saved.result.items : items).map((item) => [
      item.id,
      item,
    ]),
  );
  function tryAny() {
    filtersButton.current?.focus();
    setFilters(anyFilters);
    suggest(anyFilters);
  }
  return (
    <main id="main-content" tabIndex={-1} className="app-container app-main">
      <p className="app-eyebrow">Good combinations, already in your closet.</p>
      <h1>A little outfit inspiration</h1>
      <p className="app-intro">
        Outfits from your own clothes, with a little less guesswork.
      </p>
      <form
        className="outfit-filters"
        onSubmit={(event) => {
          event.preventDefault();
          suggest();
        }}
      >
        <div className="outfit-filter-summary">
          <Button
            ref={filtersButton}
            type="button"
            variant="outline"
            aria-expanded={expanded}
            aria-controls={panel}
            onClick={() => setExpanded(!expanded)}
          >
            <Icon icon={SlidersHorizontal} /> Filters{' '}
            <Icon
              icon={ChevronDown}
              className={expanded ? 'outfit-filter-chevron-open' : undefined}
            />
          </Button>
          <p>
            {filters.season === 'Any' ? 'Any season' : filters.season} ·{' '}
            {filters.formality === 'Any' ? 'Any formality' : filters.formality}
          </p>
        </div>
        <div id={panel} className="outfit-filter-options" hidden={!expanded}>
          <PictorialOptions
            legend="Season"
            choices={[anyChoice, ...seasonChoices]}
            value={filters.season}
            onChange={(season) =>
              setFilters({
                ...filters,
                season: season as OutfitFilters['season'],
              })
            }
          />
          <PictorialOptions
            legend="Formality"
            choices={[anyChoice, ...formalityChoices]}
            value={filters.formality}
            onChange={(formality) =>
              setFilters({
                ...filters,
                formality: formality as OutfitFilters['formality'],
              })
            }
          />
        </div>
        <Button
          type="submit"
          className="outfit-submit"
          aria-label="Suggest outfits"
          disabled={
            !items.length || status === 'pending' || (isAccount && !!loadError)
          }
          aria-busy={status === 'pending'}
        >
          <span className="outfit-submit-spinner" aria-hidden="true">
            {status === 'pending' && <Spinner />}
          </span>
          <span className="outfit-submit-label">Suggest outfits</span>
        </Button>
      </form>
      <div className="outfit-announcement" role="status">
        {status === 'pending' && 'Finding combinations from your clothes…'}
        {status === 'ready' &&
          items.length > 0 &&
          'Choose Suggest outfits to see combinations for your current clothes and filters.'}
        {status === 'error' && (
          <span className="sr-only">
            Suggestions could not be generated. Your clothes and filters are
            preserved.
          </span>
        )}
        {successful &&
          (successful.candidates.length ? (
            `${successful.candidates.length} ${successful.candidates.length === 1 ? 'outfit' : 'outfits'} shown.`
          ) : (
            <span className="sr-only">
              {outcomeAnnouncements[successful.outcome]}
            </span>
          ))}
      </div>
      {!items.length && (
        <EmptyState
          title="Your own clothes come first."
          action={
            <Button asChild>
              <Link href="/quick-add">Choose your first pieces</Link>
            </Button>
          }
        >
          <p>
            Choose clothes you own from Quick-add. An outfit needs a top,
            bottoms and shoes.
          </p>
        </EmptyState>
      )}
      {status === 'error' && !successful && (
        <EmptyState
          title="Suggestions could not be generated."
          action={<Button onClick={() => suggest()}>Retry suggestions</Button>}
        >
          <p>
            {isAccount
              ? saved.error
              : 'Your clothes and filters are still here. Try generating suggestions again.'}
          </p>
        </EmptyState>
      )}
      {successful?.outcome === 'missing-groups' && (
        <EmptyState title="A few pieces are missing.">
          <p>Add the missing clothing groups to make a complete outfit.</p>
          <div className="similarity-actions">
            {successful.diagnostics.missingGroups.map((group) => (
              <Button key={group} variant="outline" asChild>
                <Link href={`/quick-add?group=${encodeURIComponent(group)}`}>
                  Add {group.toLowerCase()}
                </Link>
              </Button>
            ))}
          </div>
        </EmptyState>
      )}
      {successful?.outcome === 'filtered-groups' && (
        <EmptyState
          title="These filters need different pieces."
          action={<Button onClick={tryAny}>Try Any filters</Button>}
        >
          <p>
            No{' '}
            {successful.diagnostics.filteredMissingGroups
              .join(', ')
              .toLowerCase()}{' '}
            match your selected season and formality. You can adjust the filters
            or choose more clothes.
          </p>
        </EmptyState>
      )}
      {successful &&
        ['no-compatible-outfits', 'hidden-disliked'].includes(
          successful.outcome,
        ) && (
          <EmptyState
            title="No compatible combinations for these filters."
            action={<Button onClick={tryAny}>Try Any filters</Button>}
          >
            <p>
              Try another season or formality, or{' '}
              <Link href="/wardrobe">review your clothing tags</Link>.
            </p>
          </EmptyState>
        )}
      {successful?.outcome === 'search-limited' && (
        <EmptyState
          title="This search reached its limit."
          action={
            <Button variant="outline" onClick={() => setExpanded(true)}>
              Adjust filters
            </Button>
          }
        >
          <p>
            Try a more specific season or formality to explore a smaller set of
            combinations.
          </p>
        </EmptyState>
      )}
      {!!successful?.candidates.length && (
        <>
          {(!successful.diagnostics.searchExhaustive ||
            successful.diagnostics.poolTruncated) && (
            <p className="wardrobe-inline-note">
              Suggestions come from a bounded selection of combinations. More
              specific filters can help explore your wardrobe.
            </p>
          )}
          <div className="outfit-grid">
            {successful.candidates.map((candidate) => (
              <OutfitCard
                key={candidate.id}
                candidate={candidate}
                items={byId}
              />
            ))}
          </div>
          {isAccount && saved.error && (
            <p role="alert" className="wardrobe-error">
              {saved.error}
            </p>
          )}
          {isAccount && successful.moreAvailable && (
            <div className="similarity-actions">
              <Button
                onClick={() => {
                  appendedStart.current = successful.candidates.length;
                  saved.showMore();
                }}
                disabled={status === 'pending'}
                aria-busy={status === 'pending'}
              >
                {saved.retryMore && status === 'error'
                  ? 'Retry more outfits'
                  : 'Show more'}
              </Button>
            </div>
          )}
        </>
      )}
      {!isAccount && (
        <section className="outfit-account" aria-label="Account benefits">
          <div>
            <h2>
              {successful?.moreAvailable
                ? 'More outfits with an account'
                : 'Keep your wardrobe with you'}
            </h2>
            <p>
              {successful?.moreAvailable
                ? account.enabled
                  ? 'Create an account or sign in to see more outfit suggestions.'
                  : 'An account will unlock more outfit suggestions from these clothes.'
                : account.enabled
                  ? 'Create an account or sign in to sync your wardrobe across browsers.'
                  : 'An account will let you sync your wardrobe, save outfit preferences and track wears.'}
            </p>
            <p>
              {account.enabled
                ? 'Your selections transfer after verified sign-in. Outfit preferences and wear tracking are coming later.'
                : 'Account access is coming soon. Your selected clothes stay in this browser.'}
            </p>
          </div>
          {account.enabled ? (
            <div className="similarity-actions">
              <Button variant="outline" asChild>
                <Link href="/sign-up">Create account</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          ) : (
            <AccountAccess variant="outline">
              About account access
            </AccountAccess>
          )}
        </section>
      )}
      {isAccount ? <WardrobeDataNotice /> : <VisitorStorageNotice />}
    </main>
  );
}
