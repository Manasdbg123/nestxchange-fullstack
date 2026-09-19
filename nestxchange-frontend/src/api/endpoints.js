import api from './client';

/**
 * Every network call the app makes, in one place.
 *
 * Components used to build query strings and URLs inline, so the same filter
 * was spelled three different ways across the codebase and none of them
 * matched what the API actually accepted.
 */

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials).then((r) => r.data),
    register: (details) => api.post('/auth/register', details).then((r) => r.data),
    me: () => api.get('/auth/me').then((r) => r.data),
};

// --------------------------------------------------------------------------
// Properties
// --------------------------------------------------------------------------

/** Drops empty values so the URL carries only filters the user actually set. */
function toSearchParams(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            // Repeat the key per value: the API binds `type=ROOM&type=PG` to a list.
            value.forEach((entry) => {
                if (entry !== undefined && entry !== null && entry !== '') {
                    params.append(key, entry);
                }
            });
            return;
        }
        if (typeof value === 'boolean') {
            if (value) params.append(key, 'true');
            return;
        }
        params.append(key, value);
    });

    return params;
}

export const propertyApi = {
    search: (filters, { page = 0, size = 12 } = {}) => {
        const params = toSearchParams(filters);
        params.set('page', page);
        params.set('size', size);
        return api.get(`/properties?${params.toString()}`).then((r) => r.data);
    },

    getById: (id) => api.get(`/properties/${id}`).then((r) => r.data),

    popularCities: (limit = 8) =>
        api.get(`/properties/cities?limit=${limit}`).then((r) => r.data),

    create: (formData) => api.post('/properties', formData).then((r) => r.data),

    update: (id, payload) => api.put(`/properties/${id}`, payload).then((r) => r.data),

    remove: (id) => api.delete(`/properties/${id}`).then((r) => r.data),

    mine: () => api.get('/properties/my-properties').then((r) => r.data),

    favorites: () => api.get('/properties/favorites').then((r) => r.data),

    toggleFavorite: (id) =>
        api.post(`/properties/${id}/favorite`).then((r) => r.data.favorited),
};

// --------------------------------------------------------------------------
// Listings (category-agnostic: PROPERTY + VEHICLE, rent/buy/sell)
// --------------------------------------------------------------------------

/**
 * `attributes` is a flat `{ key: value }` map of category-specific filters
 * (from CategorySchema). Each entry becomes an `attr.<key>` query param, so
 * the same helper that flattens universal filters also flattens these -
 * there is nothing category-specific about building the query string itself.
 */
function toListingSearchParams({ attributes, ...universal }) {
    const params = toSearchParams(universal);
    Object.entries(attributes ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        params.append(`attr.${key}`, value);
    });
    return params;
}

export const listingApi = {
    schemas: () => api.get('/listings/schemas').then((r) => r.data),

    search: (filters, { page = 0, size = 12 } = {}) => {
        const params = toListingSearchParams(filters);
        params.set('page', page);
        params.set('size', size);
        return api.get(`/listings/search?${params.toString()}`).then((r) => r.data);
    },

    getById: (id) => api.get(`/listings/${id}`).then((r) => r.data),

    create: (payload) => api.post('/listings', payload).then((r) => r.data),

    update: (id, payload) => api.put(`/listings/${id}`, payload).then((r) => r.data),

    remove: (id) => api.delete(`/listings/${id}`).then((r) => r.data),

    mine: () => api.get('/listings/my-listings').then((r) => r.data),

    fireTransition: (id, event) => api.post(`/listings/${id}/transitions`, { event }).then((r) => r.data),

    transitionHistory: (id) => api.get(`/listings/${id}/transitions`).then((r) => r.data),

    uploadImages: (id, files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        return api.post(`/listings/${id}/images`, formData).then((r) => r.data);
    },

    deleteImage: (id, imageId) => api.delete(`/listings/${id}/images/${imageId}`).then((r) => r.data),

    setPrimaryImage: (id, imageId) =>
        api.patch(`/listings/${id}/images/${imageId}/primary`).then((r) => r.data),

    toggleFavorite: (id) => api.post(`/listings/${id}/favorite`).then((r) => r.data.favorited),

    favorites: () => api.get('/listings/favorites').then((r) => r.data),

    sendInquiry: (id, message) => api.post(`/listings/${id}/inquiries`, { message }).then((r) => r.data),

    inquiriesReceived: (id) => api.get(`/listings/${id}/inquiries`).then((r) => r.data),

    inquiriesSent: () => api.get('/listings/inquiries/sent').then((r) => r.data),
};

// --------------------------------------------------------------------------
// Assistant (RAG chat grounded in live listing search)
// --------------------------------------------------------------------------

export const assistantApi = {
    chat: (message, history = []) =>
        api.post('/assistant/chat', { message, history }).then((r) => r.data),
};

// --------------------------------------------------------------------------
// Visits
// --------------------------------------------------------------------------

export const visitApi = {
    request: (payload) => api.post('/visits', payload).then((r) => r.data),
    mine: () => api.get('/visits/my-requests').then((r) => r.data),
    forMyListings: (pendingOnly = false) =>
        api.get(`/visits/owner-requests?pendingOnly=${pendingOnly}`).then((r) => r.data),
    setStatus: (visitId, status) =>
        api.patch(`/visits/${visitId}/status?status=${status}`).then((r) => r.data),
    cancel: (visitId) => api.delete(`/visits/${visitId}`).then((r) => r.data),
};

export { toSearchParams };
