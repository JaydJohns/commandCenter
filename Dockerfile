# Build stage for React frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy root package.json and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy backend package.json and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=build /app/dist ./dist

# Ensure the database file can be mounted properly
RUN touch /app/backend/db.sqlite

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/backend/db.sqlite

EXPOSE 3001

# Run the backend server
WORKDIR /app/backend
CMD ["node", "server.js"]
