// tests/Interested Catagory/PUT/updateInterestedCatagory.js
require('dotenv').config();
const axios = require('axios');

// Env (keep secrets out of code)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // "Bearer <jwt>"
const COOKIE = process.env.COOKIE;           // "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Args:
//   node updateInterestedCatagory.js <id> <categoryName>
// Defaults to id=24 and categoryName="Gaming" if not provided.
const ID = '3';
const categoryName = 'Laptops';

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
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

(async () => {
    try {
        // Your project uses "catagory" spelling; if 404, try corrected fallback.
        let res;
        try {
            res = await http.put(`/interested-catagory/${ID}`, { categoryName });
        } catch (e) {
            if (e?.response?.status === 404) {
                res = await http.put(`/interested-category/${ID}`, { categoryName });
            } else {
                throw e;
            }
        }

        console.log(`Updated ID ${ID} -> categoryName="${categoryName}"`);
        console.dir(res.data, { depth: null, colors: true });

        const rows = toRows(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map((row) => ({
                    id: row.id,
                    email: row.email || '—',
                    category: row.categoryName || '—',
                    createdAt: row.createdAt || '—',
                    updatedAt: row.updatedAt || '—',
                }))
            );
        }
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) {
                console.error('Unauthorized (401): token missing/invalid or no user email in token.');
            } else if (status === 403) {
                console.error('Forbidden (403): Not owner. The token email does not match the record’s email.');
            } else if (status === 404) {
                console.error(`No record found for ID ${ID}.`);
            } else {
                console.error('Error:', status, data);
            }
        } else {
            console.error('Error:', error.message);
        }
        process.exitCode = 1;
    }
})();
