// tests/Item Category/PUT/updateItemCategoryById.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // "Bearer <jwt>"
const COOKIE = process.env.COOKIE;       // "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// --- Edit these as needed ---
const ID = process.argv[2] || '1';
const CATEGORY_NAME = process.argv[3] || 'Updated Electronics';
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

function normalize(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data) return [payload.data];
    return [payload];
}

(async () => {
    try {
        const res = await http.put(`/item-catagory/${ID}`, { categoryName: CATEGORY_NAME });
        console.dir(res.data, { depth: null, colors: true });

        const rows = normalize(res.data);
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
            else if (status === 403) console.error('Forbidden (403): Not item owner.');
            else if (status === 404) console.error(`Not found (404): category id ${ID} or linked item.`);
            else console.error('Error:', status, data);
        } else {
            console.error('Error:', error.message);
        }
        process.exitCode = 1;
    }
})();
