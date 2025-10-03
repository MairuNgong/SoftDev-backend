// tests/Interested Catagory/DELETE/deleteInterestedCatagory.js
require('dotenv').config();
const axios = require('axios');

// Env config (keep secrets out of code)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;   // "Bearer <jwt>"
const COOKIE = process.env.COOKIE;           // "connect.sid=..."

if (!BASE_URL) throw new Error('Missing BASE_URL in .env');

// Use the ID from CLI if provided; default to 2 to mirror your example
const ID = '45';

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
        // Project uses "catagory" spelling; if that 404s (route missing), try corrected form once
        let res;
        try {
            res = await http.delete(`/interested-catagory/${ID}`);
        } catch (e) {
            if (e?.response?.status === 404) {
                res = await http.delete(`/interested-category/${ID}`);
            } else {
                throw e;
            }
        }

        console.log(`Deleted ID ${ID}:`);
        if (res?.data && Object.keys(res.data).length) {
            console.dir(res.data, { depth: null, colors: true });
        } else {
            console.log('{ success: true }'); // common minimal response
        }
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) {
                console.error('Unauthorized (401): missing/invalid token or no user email in token.');
            } else if (status === 403) {
                console.error('Forbidden (403): Not owner (token email differs from record).');
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
