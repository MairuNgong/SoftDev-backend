// tests/Interested Catagory/POST/createInterestedCatagory.js
require('dotenv').config();
const axios = require('axios');

// Env config (keep secrets out of code)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // e.g., "Bearer <jwt>"
const COOKIE = process.env.COOKIE;           // e.g., "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Axios client
const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
        ...(COOKIE ? { Cookie: COOKIE } : {}),
    },
    maxBodyLength: Infinity,
});

// Payload (edit as needed or pass via CLI: node file.js "Gaming")
const categoryName = process.argv[2] || 'Gaming';
const body = { categoryName };

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
        // Project currently uses the "catagory" spelling; if 404, try "category"
        let res;
        try {
            res = await http.post('/interested-catagory/', body);
        } catch (e) {
            if (e?.response?.status === 404) {
                res = await http.post('/interested-category/', body);
            } else {
                throw e;
            }
        }

        console.log('Result:');
        console.dir(res.data, { depth: null, colors: true });

        const rows = toRows(res.data);
        if (rows.length) {
            console.log('\nTable View:');
            console.table(
                rows.map((row) => ({
                    id: row.id,
                    email: row.email || '—',
                    category: row.categoryName || categoryName || '—',
                    createdAt: row.createdAt || '—',
                    updatedAt: row.updatedAt || '—',
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
