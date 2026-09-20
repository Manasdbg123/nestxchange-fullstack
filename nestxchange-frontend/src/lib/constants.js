/**
 * Shared vocabulary between the UI and the API.
 *
 * These enum values were previously typed as string literals at each call site,
 * which is how the listings page ended up filtering on a `PG` type the category
 * strip never actually sent.
 */

export const PROPERTY_TYPES = [
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'HOUSE', label: 'Independent house' },
    { value: 'VILLA', label: 'Villa' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'ROOM', label: 'Room' },
    { value: 'PG', label: 'PG / Hostel' },
    { value: 'SHOP', label: 'Shop' },
    { value: 'COMMERCIAL', label: 'Commercial space' },
];

/**
 * The category strip on the listings page. Each maps to one or more API types.
 *
 * `shortLabel` is for the hero search tabs, which sit in a narrow column - the
 * full labels overflowed it and the last tab was visibly clipped.
 */
export const PROPERTY_CATEGORIES = [
    { id: 'all', label: 'All homes', shortLabel: 'All', types: [] },
    {
        id: 'residential',
        label: 'Apartments & houses',
        shortLabel: 'Apartments',
        types: ['APARTMENT', 'HOUSE', 'STUDIO'],
    },
    { id: 'villas', label: 'Villas', shortLabel: 'Villas', types: ['VILLA'] },
    { id: 'rooms', label: 'Rooms & PG', shortLabel: 'Rooms & PG', types: ['ROOM', 'PG'] },
    {
        id: 'commercial',
        label: 'Shops & offices',
        shortLabel: 'Commercial',
        types: ['SHOP', 'COMMERCIAL'],
    },
];

export const FURNISHING_OPTIONS = [
    { value: 'UNFURNISHED', label: 'Unfurnished' },
    { value: 'SEMI_FURNISHED', label: 'Semi furnished' },
    { value: 'FULLY_FURNISHED', label: 'Fully furnished' },
];

export const TENANT_OPTIONS = [
    { value: 'ANY', label: 'Anyone' },
    { value: 'FAMILY', label: 'Family' },
    { value: 'BACHELOR', label: 'Bachelors' },
    { value: 'COMPANY', label: 'Company lease' },
];

export const BHK_OPTIONS = [
    { value: 1, label: '1 BHK' },
    { value: 2, label: '2 BHK' },
    { value: 3, label: '3 BHK' },
    { value: 4, label: '4 BHK' },
    { value: 5, label: '4+ BHK' },
];

export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Rent: low to high' },
    { value: 'price_desc', label: 'Rent: high to low' },
    { value: 'area_desc', label: 'Largest first' },
];

export const AVAILABILITY_OPTIONS = [
    { value: '', label: 'Any time' },
    { value: '0', label: 'Immediately' },
    { value: '15', label: 'Within 15 days' },
    { value: '30', label: 'Within 30 days' },
    { value: '60', label: 'Within 60 days' },
];

/** Offered as checkboxes when posting a listing. */
export const AMENITY_OPTIONS = [
    'Lift',
    'Power Backup',
    'Gated Security',
    'Reserved Parking',
    'Visitor Parking',
    'Gym',
    'Swimming Pool',
    'Club House',
    "Children's Play Area",
    'Park',
    'Piped Gas',
    'Wi-Fi',
    'Intercom',
    'Water Purifier',
    'Air Conditioning',
    'Modular Kitchen',
];

/** Used to place map markers; the API does not yet store coordinates. */
export const CITY_COORDINATES = {
    Patna: [25.5941, 85.1376],
    Darbhanga: [26.1542, 85.8918],
    Muzaffarpur: [26.1225, 85.3906],
    Madhubani: [26.3477, 86.0716],
    Bhagalpur: [25.2425, 86.9842],
    Gaya: [24.7955, 84.9994],
    Purnia: [25.7771, 87.4753],
    Chhapra: [25.7815, 84.7278],
};

export const INDIA_CENTRE = [20.5937, 78.9629];

/**
 * The two top-level categories the unified Listing engine understands.
 * Kept in lockstep with the backend's CategorySchemaRegistry - the icon and
 * label here are presentation only, the actual field list always comes from
 * GET /listings/schemas rather than being duplicated here.
 */
export const LISTING_CATEGORIES = [
    { value: 'PROPERTY', label: 'Property', icon: 'building' },
    { value: 'VEHICLE', label: 'Vehicle', icon: 'car' },
];

export const LISTING_MODES = [
    { value: 'RENT', label: 'Rent', description: 'Find something to rent' },
    { value: 'BUY', label: 'Buy', description: 'Find something to buy' },
    { value: 'SELL', label: 'Sell', description: 'List something of yours' },
];

/**
 * `Listing.mode` has exactly one value per listing - a lister posts it as
 * either RENT or SELL (never BUY: "I want to sell this in BUY mode" makes no
 * sense). So a buyer browsing must search `mode=SELL` to find what sellers
 * actually posted; "Buy" is a UI-only label over that same value. BUY exists
 * as an enum value for symmetry with the landing selector's three buttons,
 * but nothing ever creates or searches for it directly - see
 * `toBrowseModeValue` below, which is the one place that translation happens.
 */
export function toBrowseModeValue(mode) {
    return mode === 'BUY' ? 'SELL' : mode;
}

/** What a browsing visitor picks: Rent, or Buy (which searches mode=SELL). */
export const BROWSE_MODES = [
    { value: 'RENT', label: 'Rent' },
    { value: 'SELL', label: 'Buy' },
];

/** What a lister picks when posting: renting out, or selling. Not "Buy". */
export const CREATE_MODES = [
    { value: 'RENT', label: 'For rent' },
    { value: 'SELL', label: 'For sale' },
];

export const LISTING_STATUS_BADGES = {
    AVAILABLE: { label: 'Available', tone: 'success' },
    REQUESTED: { label: 'Requested', tone: 'warning' },
    CONFIRMED: { label: 'Confirmed', tone: 'info' },
    ACTIVE: { label: 'Active rental', tone: 'brand' },
    COMPLETED: { label: 'Sale completed', tone: 'brand' },
    CLOSED: { label: 'Closed', tone: 'neutral' },
};

export const VISIT_STATUS_LABELS = {
    PENDING: 'Awaiting owner',
    ACCEPTED: 'Confirmed',
    REJECTED: 'Declined',
    EXPIRED: 'Expired',
};

export const LISTING_STATUS_LABELS = {
    AVAILABLE: 'Live',
    ACTIVE: 'Live',
    UNDER_REVIEW: 'Under review',
    RENTED: 'Rented out',
    INACTIVE: 'Paused',
};
