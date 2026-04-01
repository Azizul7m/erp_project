# frontend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy all frontend files
COPY frontend/ .

# Build React app for production
RUN npm run build

# Production stage (serve with Nginx)
FROM nginx:alpine

# Copy built React files to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for React (SPA routing)
COPY frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]