const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndhdHRhbnVuNDJAZ21haWwuY29tIiwibmFtZSI6IldhdHRhbnVuIFRlZXJhdGFuYXBvbmciLCJpYXQiOjE3NTgxMTIwOTMsImV4cCI6MTc1OTQwODA5M30.yt8cGIvchRIndmpIpMV8n6sDVOUJyzQ_oZ0ws8yDe3o';
const COOKIE = 'connect.sid=s%3AqlBfcxmrihroUAgHbNo4W_NJvy0eUkoM.jsCI2DmtEhLq8nt%2FQfJ60Vpn%2BMMW0sv%2BAIL588EZwcg';

const ITEM_ID = '2'; 

const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${BASE_URL}/interested-catagory/${ITEM_ID}`,
    headers: {
        'Authorization': AUTH_TOKEN,
        'Cookie': COOKIE
    }
};

axios.request(config)
    .then((response) => {
        console.log("Result:");
        console.dir(response.data, { depth: null, colors: true });
    })
    .catch((error) => {
        if (error.response) {
            console.error("Error:", error.response.status, error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    });
