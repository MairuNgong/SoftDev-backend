const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndhdHRhbnVuNDJAZ21haWwuY29tIiwibmFtZSI6IldhdHRhbnVuIFRlZXJhdGFuYXBvbmciLCJpYXQiOjE3NTc4NTc5MTEsImV4cCI6MTc1OTE1MzkxMX0.VgkTWjYce6rVQ0LzW9gWo8DiWNzJEo-Rpih95VjkaaE';
const COOKIE = 'connect.sid=s%3Avruu2d7sOW7Dh13hRrlaJECha0NWmZgs.%2BXNld%2B8QhCSS385ZqO5KnuhBm31gefwWQWagUq%2BwauI';

const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASE_URL}/interested-catagory`,
    headers: {
        'Authorization': AUTH_TOKEN,
        'Cookie': COOKIE
    }
};

axios.request(config)
    .then((response) => {
        console.dir(response.data, { depth: null, colors: true });

        if (response.data && Array.isArray(response.data.data)) {
            console.log("\nTable View:");
            console.table(
                response.data.data.map(row => ({
                    id: row.id,
                    email: row.email,
                    category: row.categoryName
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
