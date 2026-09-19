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
    Bengaluru: [12.9716, 77.5946],
    Mumbai: [19.076, 72.8777],
    Pune: [18.5204, 73.8567],
    Delhi: [28.7041, 77.1025],
    Hyderabad: [17.385, 78.4867],
    Chennai: [13.0827, 80.2707],
    Kolkata: [22.5726, 88.3639],
    Ahmedabad: [23.0225, 72.5714],
    Gurgaon: [28.4595, 77.0266],
    Noida: [28.5355, 77.391],
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
