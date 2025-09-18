const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndhdHRhbnVuNDJAZ21haWwuY29tIiwibmFtZSI6IldhdHRhbnVuIFRlZXJhdGFuYXBvbmciLCJpYXQiOjE3NTc4NTc5MTEsImV4cCI6MTc1OTE1MzkxMX0.VgkTWjYce6rVQ0LzW9gWo8DiWNzJEo-Rpih95VjkaaE';
const COOKIE = 'connect.sid=s%3Avruu2d7sOW7Dh13hRrlaJECha0NWmZgs.%2BXNld%2B8QhCSS385ZqO5KnuhBm31gefwWQWagUq%2BwauI';

const body = {
    name: "samsung 17",
    priceRange: "30000-35000",
    description: "Lightly used iPhone 14 Pro, 128GB, Deep Purple. Comes with box and charger.",
    categoryNames: [
        "Electronics",
        "Mobile Phone"
    ]
};

const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${BASE_URL}/items/`,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN,
        'Cookie': COOKIE
    },
    data: body
};

axios.request(config)
    .then((response) => {
        console.dir(response.data, { depth: null, colors: true });

        const items = Array.isArray(response.data)
            ? response.data
            : response.data.data || [response.data];

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
        }
    })
    .catch((error) => {
        if (error.response) {
            console.error("Error:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    });
