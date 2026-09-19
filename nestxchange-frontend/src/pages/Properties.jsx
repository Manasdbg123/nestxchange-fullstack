import { Link } from 'react-router-dom';

import MarketplaceBrowser from '../components/listings/MarketplaceBrowser';
import Icon from '../components/ui/Icon';
import usePageMeta from '../hooks/usePageMeta';

/**
 * The Property & Homes marketplace: its own header and branding, but the
 * same MarketplaceBrowser as /vehicles underneath, locked to category=PROPERTY.
 */
export default function Properties() {
    usePageMeta({
        title: 'Property & Homes',
        description: 'Search houses, apartments, flats and villas to rent or buy on NestXchange.',
    });

    return (
        <>
            <div className="border-b border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
                <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                            <Icon name="building" className="h-5 w-5" strokeWidth={2} />
                        </span>
                        <div>
                            <h1 className="font-display text-xl font-extrabold text-ink-900 dark:text-ink-50">
                                Property &amp; Homes
                            </h1>
                            <p className="text-sm text-ink-500 dark:text-ink-400">
                                Houses, apartments, flats and villas - to rent or to buy.
                            </p>
                        </div>
                    </div>
                    <Link to="/create-listing?category=PROPERTY&mode=SELL" className="btn-brand btn-md">
                        <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
                        List your property
                    </Link>
                </div>
            </div>

            <MarketplaceBrowser
                lockedCategory="PROPERTY"
                emptyStateDescription="Try widening your budget or clearing a filter - or be the first to list a property here."
            />
        </>
    );
}
