// tests/Item/GET/getUnwatchedItems.js
require('dotenv').config();
const axios = require('axios');

// Pull config from .env (no secrets in code)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // e.g., "Bearer <jwt>"
const COOKIE = process.env.COOKIE;           // e.g., "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
        ...(COOKIE ? { Cookie: COOKIE } : {}),
    },
    maxBodyLength: Infinity,
});

(async () => {
    try {
        const res = await http.get('/items/un_watched_item');
        console.dir(res.data, { depth: null, colors: true });

        // Some endpoints return { data: [...] }, others return [...]
        const items = Array.isArray(res.data) ? res.data : res?.data?.data;

        const rows = Array.isArray(items) ? items : items ? [items] : [];
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map((item) => ({
                    id: item.id,
                    name: item.name,
                    priceRange: item.priceRange,
                    owner: item.ownerEmail,
                    categories: Array.isArray(item.ItemCategories)
                        ? item.ItemCategories
                            .map((c) => (typeof c === 'string' ? c : c.categoryName))
                            .join(', ')
                        : '—',
                }))
            );
        }
    } catch (error) {
        if (error.response) {
            console.error('Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exitCode = 1;
    }
})();
