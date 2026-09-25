const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
const count = new Intl.NumberFormat('en-PH');

export const money = (value) => peso.format(Number(value) || 0);
export const number = (value) => count.format(Number(value) || 0);

export const plural = (n, one, many = `${one}s`) => `${number(n)} ${n === 1 ? one : many}`;

// Storage can throw (private mode, blocked site data); the page must still work.
export function readStore(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export function writeStore(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* the tray simply won't survive a reload */
    }
}
