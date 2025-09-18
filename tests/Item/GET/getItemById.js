// tests/Item/GET/getItemById.js
require('dotenv').config();
const axios = require('axios');

// Secrets / env-config (safe to keep in .env)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   
const COOKIE = process.env.COOKIE;           

const ITEM_ID = '25'; 

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
        const res = await http.get(`/items/${ITEM_ID}`);
        console.dir(res.data, { depth: null, colors: true });

        const payload = res?.data?.data;
        const rows = Array.isArray(payload) ? payload : (payload ? [payload] : []);

        if (rows.length) {
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
