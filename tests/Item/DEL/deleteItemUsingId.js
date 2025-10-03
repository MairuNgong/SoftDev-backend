// tests/Item/DELETE/deleteItem.js
require('dotenv').config();
const axios = require('axios');

// Secrets / env-config (keep these in .env)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // e.g., "Bearer <jwt>"
const COOKIE = process.env.COOKIE;           // e.g., "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Fixture (ok to hard-code)
const ITEM_ID = '28'; 

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
        const res = await http.delete(`/items/${ITEM_ID}`);
        console.dir(res.data, { depth: null, colors: true });

        // Optional: show a tiny success summary if API returns nothing fancy
        if (!res?.data || Object.keys(res.data).length === 0) {
            console.log(`\nDeleted item ${ITEM_ID} successfully (empty body).`);
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
