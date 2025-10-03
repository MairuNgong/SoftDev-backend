// tests/Interested Catagory/GET/getInterestedCatagoryById.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const COOKIE = process.env.COOKIE;

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Hard-coded fixture ID (not a secret). Optionally allow CLI override: node file.js 24
const ITEM_ID = '24';

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
        ...(COOKIE ? { Cookie: COOKIE } : {}),
    },
    maxBodyLength: Infinity,
});

function toRows(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object') return [payload.data];
    if (typeof payload === 'object') return [payload];
    return [];
}

async function getOneById(id) {
    try {
        // your original route (with the project’s spelling)
        return await http.get(`/interested-catagory/${id}`);
    } catch (e) {
        if (e?.response?.status === 404) {
            // try corrected spelling once, then bubble up
            return await http.get(`/interested-category/${id}`);
        }
        throw e;
    }
}

(async () => {
    try {
        const res = await getOneById(ITEM_ID);
        console.log(`Result for ID ${ITEM_ID}:`);
        console.dir(res.data, { depth: null, colors: true });

        const rows = toRows(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map((row) => ({
                    id: row.id,
                    email: row.email || row.ownerEmail || '—',
                    category:
                        row.categoryName ||
                        (Array.isArray(row.ItemCategories)
                            ? row.ItemCategories
                                .map((c) => (typeof c === 'string' ? c : c.categoryName))
                                .join(', ')
                            : '—'),
                    createdAt: row.createdAt || '—',
                    updatedAt: row.updatedAt || '—',
                }))
            );
        }
    } catch (err) {
        if (err?.response?.status === 404) {
            console.error(`No record found for ID ${ITEM_ID}.`);
            process.exitCode = 1;
            return;
        }

        if (err.response) {
            console.error('Error:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message);
        }
        process.exitCode = 1;
    }
})();
