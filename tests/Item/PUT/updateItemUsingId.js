// tests/Item/PUT/updateItem.js
require('dotenv').config();
const axios = require('axios');

// Secrets / env-config (keep these in .env)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // e.g., "Bearer <jwt>"
const COOKIE = process.env.COOKIE;           // e.g., "connect.sid=..."

// Fixture (ok to hard-code)
const ITEM_ID = '14'; 

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
        ...(COOKIE ? { Cookie: COOKIE } : {}),
    },
    maxBodyLength: Infinity,
});

// Your update payload
const body = {
    name: 'samsung 17',
    priceRange: '30000-35000',
    description:
        'Lightly used iPhone 14 Pro, 128GB, Deep Purple. Comes with box and charger.',
    categoryNames: ['Electronics', 'Mobile Phone'],
};

(async () => {
    try {
        const res = await http.put(`/items/${ITEM_ID}`, body);
        console.dir(res.data, { depth: null, colors: true });

        // Normalize {data: {...}} | {data: [...]} | {...}
        const payload = res?.data;
        let rows;
        if (Array.isArray(payload)) rows = payload;
        else if (Array.isArray(payload?.data)) rows = payload.data;
        else if (payload?.data) rows = [payload.data];
        else rows = [payload];

        if (rows?.length) {
            console.log('\nTable View:');
            console.table(
                rows.map((item) => ({
                    id: item?.id,
                    name: item?.name,
                    priceRange: item?.priceRange,
                    owner: item?.ownerEmail,
                    categories: Array.isArray(item?.ItemCategories)
                        ? item.ItemCategories
                            .map((c) => (typeof c === 'string' ? c : c.categoryName))
                            .join(', ')
                        : Array.isArray(item?.categoryNames)
                            ? item.categoryNames.join(', ')
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
