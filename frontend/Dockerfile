# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a simple server script
RUN echo 'const express = require("express"); const path = require("path"); const app = express(); app.use(express.static(path.join(__dirname, "dist"))); app.get("*", (req, res) => { res.sendFile(path.join(__dirname, "dist/index.html")); }); app.listen(3000, () => console.log("Frontend running on port 3000"));' > server.js

# Use serve instead for better handling
ENV NODE_ENV=production

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
