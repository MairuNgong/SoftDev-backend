// tests/Item Category/GET/getItemCategoryById.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // e.g., "Bearer <jwt>"
const COOKIE = process.env.COOKIE;       // e.g., "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Hard-code an ID or pass one via CLI: node getItemCategoryById.js 2
const ID = '2';

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
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
        const res = await http.get(`/item-catagory/${ID}`);
        console.dir(res.data, { depth: null, colors: true });

        const rows = normalize(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map((r) => ({
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
            if (error.response.status === 404) {
                console.error(`No record found for ID ${ID}.`);
            } else {
                console.error('Error:', error.response.status, error.response.data);
            }
        } else {
            console.error('Error:', error.message);
        }
        process.exitCode = 1;
    }
})();
