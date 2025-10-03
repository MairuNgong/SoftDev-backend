// tests/Item/GET/getAllItem.js
require('dotenv').config();
const axios = require('axios');

const { BASE_URL, AUTH_TOKEN, COOKIE } = process.env;
if (!BASE_URL) {
    throw new Error('Missing BASE_URL in .env');
}

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
        const res = await http.get('/items/');
        console.dir(res.data, { depth: null, colors: true });

        if (res.data && Array.isArray(res.data.data)) {
            console.log('\nTable View:');
            console.table(
                res.data.data.map(item => ({
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
