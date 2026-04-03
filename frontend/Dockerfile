# frontend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy all frontend files
COPY frontend/ .

# Build Next.js app for production
RUN npm run build

# Production stage (serve with Nginx)
FROM nginx:alpine

# Copy built files to Nginx root
COPY --from=builder /app/.next /usr/share/nginx/html/.next
COPY --from=builder /app/public /usr/share/nginx/html
COPY --from=builder /app/package.json /usr/share/nginx/html

# If using a custom nginx config, uncomment and set path
# COPY frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]