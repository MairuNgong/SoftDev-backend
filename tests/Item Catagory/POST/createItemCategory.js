// tests/Item Category/POST/createItemCategory.js
require('dotenv').config();
const axios = require('axios');

// Env config
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // "Bearer <jwt>"
const COOKIE = process.env.COOKIE;       // "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// --- Edit these as needed ---
const ITEM_ID = 1;
const CATEGORY_NAME = 'Sex Toy';
// ----------------------------

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
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data) return [payload.data];
    return [payload];
}

(async () => {
    try {
        const body = { itemId: ITEM_ID, categoryName: CATEGORY_NAME };
        const res = await http.post('/item-catagory/', body);

        console.dir(res.data, { depth: null, colors: true });

        const rows = rowsFrom(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map(r => ({
                    id: r.id,
                    itemId: r.itemId,
                    categoryName: r.categoryName || '—',
                }))
            );
        } else {
            console.log('No data returned.');
        }
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) console.error('Unauthorized (401): token missing/invalid.');
            else if (status === 403) console.error('Forbidden (403): Not item owner for this itemId.');
            else if (status === 404) console.error('Not found (404): item or route.');
            else console.error('Error:', status, data);
        } else {
            console.error('Error:', error.message);
        }
        process.exitCode = 1;
    }
})();
