// tests/Item/GET/getItemsByOwner.js
require('dotenv').config();
const axios = require('axios');

// Read from .env
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;       // e.g., "Bearer <jwt>"
const COOKIE = process.env.COOKIE;               // e.g., "connect.sid=..."
const OWNER_EMAIL = process.env.OWNER_EMAIL;     // e.g., "you@example.com"

if (!BASE_URL) {
    throw new Error('Missing BASE_URL in .env');
}
if (!OWNER_EMAIL) {
    throw new Error('Missing OWNER_EMAIL in .env');
}

// Preconfigured axios client
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
        const res = await http.get('/items', { params: { ownerEmail: OWNER_EMAIL } });
        console.dir(res.data, { depth: null, colors: true });

        const rows = res?.data?.data;
        if (Array.isArray(rows)) {
            console.log('\nTable View:');
            console.table(
                rows.map((item) => ({
                    id: item.id,
                    name: item.name,
                    priceRange: item.priceRange,
                    owner: item.ownerEmail,
                    categories: Array.isArray(item.ItemCategories)
                        ? item.ItemCategories.join(', ')
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
