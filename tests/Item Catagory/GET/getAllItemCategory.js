// tests/Item Category/GET/getAllItemCategory.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const COOKIE = process.env.COOKIE;

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
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
        const res = await http.get('/item-catagory');
        console.dir(res.data, { depth: null, colors: true });

        const rows = rowsFrom(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map(r => ({
                    id: r.id,
                    itemId: r.itemId,
                    categoryName: r.categoryName || r.name || '—',
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
