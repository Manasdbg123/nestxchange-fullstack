import { useSearchParams } from 'react-router-dom';

import MarketplaceBrowser from '../components/listings/MarketplaceBrowser';
import usePageMeta from '../hooks/usePageMeta';
import { humanise } from '../lib/format';

/**
 * The fully generic listings search - both categories, any mode, switchable
 * via the chip row. See MarketplaceBrowser for the shared logic; /properties
 * and /vehicles use the same component locked to one category.
 */
export default function ListingSearch() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category');
    const mode = searchParams.get('mode');

    usePageMeta({
        title: category ? `${humanise(category)} listings${mode ? ` to ${humanise(mode).toLowerCase()}` : ''}` : 'Browse listings',
    });

    return <MarketplaceBrowser />;
}
