
FROM node:20-alpine


WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of source code
COPY server/ .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
