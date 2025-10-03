// tests/Search/POST/itemsSearch.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const COOKIE = process.env.COOKIE;

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Edit these:
const KEYWORD = 'samsung 17';
const CATEGORIES = ['Electronics']; 

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
        ...(COOKIE ? { Cookie: COOKIE } : {}),
    },
    maxBodyLength: Infinity,
});

function rowsFrom(payload) {
    if (!payload) return [];
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    if (payload.data) return [payload.data];
    return [payload];
}

(async () => {
    try {
        const body = {
            keyword: KEYWORD,
            ...(Array.isArray(CATEGORIES) && CATEGORIES.length ? { categories: CATEGORIES } : {})
        };

        const res = await http.post('/items/search', body);

        console.log('Result:');
        console.dir(res.data, { depth: null, colors: true });

        const rows = rowsFrom(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map(r => ({
                    id: r.id,
                    name: r.name,
                    priceRange: r.priceRange || '—',
                    categories: Array.isArray(r.ItemCategories) ? r.ItemCategories.join(', ') : '—',
                    picture: Array.isArray(r.ItemPictures) ? (r.ItemPictures[0] || '—') : '—',
                    owner: r.ownerEmail || '—',
                }))
            );
        }
    } catch (e) {
        if (e.response) {
            console.error('Error:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
        process.exitCode = 1;
    }
})();
