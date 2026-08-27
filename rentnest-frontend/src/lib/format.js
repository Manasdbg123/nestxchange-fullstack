/**
 * Formatting helpers.
 *
 * Prices were previously rendered as raw numbers - "₹45000" - everywhere in the
 * app. Indian users read rent in lakh/crore groupings, and an unformatted
 * six-digit number is genuinely hard to scan at a glance.
 */

const inrCompact = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const inrNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** 45000 -> "₹45,000". Returns a dash for missing values rather than "₹NaN". */
export function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    return inrCompact.format(amount);
}

/** 4500000 -> "₹45 L", 12000000 -> "₹1.2 Cr". Used where space is tight. */
export function formatCurrencyShort(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';

    if (amount >= 10000000) {
        return `₹${trimZero(amount / 10000000)} Cr`;
    }
    if (amount >= 100000) {
        return `₹${trimZero(amount / 100000)} L`;
    }
    if (amount >= 1000) {
        return `₹${trimZero(amount / 1000)}K`;
    }
    return `₹${inrNumber.format(amount)}`;
}

function trimZero(value) {
    const rounded = value.toFixed(value < 10 ? 1 : 0);
    return rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded;
}

export function formatNumber(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? inrNumber.format(amount) : '—';
}

/** "2024-08-01" -> "1 Aug 2024". */
export function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "2024-08-01T15:30" -> "1 Aug 2024, 3:30 pm". */
export function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** "3 days ago" / "in 2 weeks", for listing age and visit dates. */
export function formatRelative(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = date.getTime() - Date.now();
    const diffDays = Math.round(diffMs / 86400000);

    if (Math.abs(diffDays) < 1) return 'today';
    const formatter = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' });
    if (Math.abs(diffDays) < 30) return formatter.format(diffDays, 'day');
    if (Math.abs(diffDays) < 365) return formatter.format(Math.round(diffDays / 30), 'month');
    return formatter.format(Math.round(diffDays / 365), 'year');
}

/** APARTMENT -> "Apartment", SEMI_FURNISHED -> "Semi furnished". */
export function humanise(value) {
    if (!value) return '';
    const lower = String(value).toLowerCase().replace(/_/g, ' ');
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** "2 BHK Apartment", or "Studio"/"Shop" where a bedroom count makes no sense. */
export function describeProperty(property) {
    if (!property) return '';
    const type = humanise(property.type);
    if (!property.rooms) return type;
    return `${property.rooms} BHK ${type}`;
}

/** True when the listing can be moved into today. */
export function isAvailableNow(property) {
    if (!property?.availableFrom) return true;
    const date = new Date(property.availableFrom);
    if (Number.isNaN(date.getTime())) return true;
    return date <= new Date();
}

/** 9876543210 -> "+91 98765 43210". */
export function formatPhone(value) {
    const digits = String(value ?? '').replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) return value ?? '';
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
