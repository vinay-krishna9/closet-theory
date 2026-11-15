import Link from 'next/link';
import credits from '../../../../public/catalog/sources/credits.json';
import provenance from '../../../../public/catalog/sources/studio-v2/provenance.json';

export default function CatalogCreditsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="app-container app-main">
      <h1>Catalog photo credits</h1>
      <p className="app-intro">
        The current catalog uses AI-generated studio garment samples, prepared
        with clean cutouts and recolored to show your selected color. Cut,
        sleeves and pattern remain representative.
      </p>
      <h2>Studio catalog · {provenance.revision}</h2>
      <p>
        Created with {provenance.generator}. The user approved this image style
        for all eight garment types on {provenance.created}.
      </p>
      <p>
        <a href="/catalog/sources/studio-v2/provenance.json">
          Generation prompts and preparation record
        </a>
      </p>
      <h2>Earlier photographic assets · v1</h2>
      <p>
        Retained earlier photographs and their derivatives carry the following
        credits and license terms. Photographers and pictured brands do not
        endorse Closet Theory.
      </p>
      <ul className="catalog-credits-list">
        {credits.map((credit) => (
          <li key={credit.id}>
            <h2>{credit.id}</h2>
            <p>
              Photo by {credit.creator}.{' '}
              <a href={credit.source}>Original source and attribution</a> ·{' '}
              <a href={credit.licenseUrl}>{credit.license}</a>
            </p>
            <p>Changes: {credit.modifications}</p>
            <p>
              The source, mask and recolored derivatives retain{' '}
              {credit.derivativeLicense}.
            </p>
          </li>
        ))}
      </ul>
      <Link href="/quick-add" className="wardrobe-back">
        Back to quick-add
      </Link>
    </main>
  );
}
