// tests/Item Category/DELETE/deleteItemCategoryById.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // "Bearer <jwt>"
const COOKIE = process.env.COOKIE;       // "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Use CLI arg if provided: node deleteItemCategoryById.js 20
const ID = '66';

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
        const res = await http.delete(`/item-catagory/${ID}`);
        // Most controllers return { success: true }; print whatever we got:
        if (res?.data && Object.keys(res.data).length) {
            console.dir(res.data, { depth: null, colors: true });
        } else {
            console.log('{ success: true }');
        }
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) console.error('Unauthorized (401): missing/invalid token.');
            else if (status === 403) console.error('Forbidden (403): Not item owner.');
            else if (status === 404) console.error(`Not found (404): category id ${ID}.`);
            else console.error('Error:', status, data);
        } else {
            console.error('Error:', error.message);
        }
        process.exitCode = 1;
    }
})();
