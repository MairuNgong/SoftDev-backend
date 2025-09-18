// tests/Interested Category/GET/getAllInterestedCategory.js
require('dotenv').config();
const axios = require('axios');

// Secrets / env-config
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
        // Try your existing route first, then a likely-corrected spelling.
        let res;
        try {
            res = await http.get('/interested-catagory');
        } catch (e) {
            if (e?.response?.status === 404) {
                res = await http.get('/interested-category');
            } else {
                throw e;
            }
        }

        console.dir(res.data, { depth: null, colors: true });

        const rows = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res?.data?.data)
                ? res.data.data
                : res?.data
                    ? [res.data]
                    : [];

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
