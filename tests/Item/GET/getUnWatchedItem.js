const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndhdHRhbnVuNDJAZ21haWwuY29tIiwibmFtZSI6IldhdHRhbnVuIFRlZXJhdGFuYXBvbmciLCJpYXQiOjE3NTc4NTc5MTEsImV4cCI6MTc1OTE1MzkxMX0.VgkTWjYce6rVQ0LzW9gWo8DiWNzJEo-Rpih95VjkaaE';
const COOKIE = 'connect.sid=s%3Avruu2d7sOW7Dh13hRrlaJECha0NWmZgs.%2BXNld%2B8QhCSS385ZqO5KnuhBm31gefwWQWagUq%2BwauI';

const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASE_URL}/items/un_watched_item`,
    headers: {
        'Authorization': AUTH_TOKEN,
        'Cookie': COOKIE
    }
};

axios.request(config)
    .then((response) => {
        console.dir(response.data, { depth: null, colors: true });

        const items = Array.isArray(response.data)
            ? response.data
            : response.data.data;

        if (Array.isArray(items)) {
            console.log("\nTable View:");
            console.table(
                items.map(item => ({
                    id: item.id,
                    name: item.name,
                    priceRange: item.priceRange,
                    owner: item.ownerEmail,
                    categories: Array.isArray(item.ItemCategories)
                        ? item.ItemCategories.map(c => c.categoryName).join(", ")
                        : "—"
                }))
            );
        } else if (items && typeof items === 'object') {
            console.log("\nTable View:");
            console.table([{
                id: items.id,
                name: items.name,
                priceRange: items.priceRange,
                owner: items.ownerEmail,
                categories: Array.isArray(items.ItemCategories)
                    ? items.ItemCategories.map(c => c.categoryName).join(", ")
                    : "—"
            }]);
        }
    })
    .catch((error) => {
        if (error.response) {
            console.error("Error:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    });
