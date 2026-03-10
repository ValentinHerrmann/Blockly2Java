FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN mkdir -p custom-generator-codelab
COPY custom-generator-codelab/package*.json ./custom-generator-codelab/
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Production stage ---
FROM node:18-alpine AS production
WORKDIR /app

# Copy built output from builder
COPY --from=builder /app .

# Install production dependencies, set permissions, and switch user
RUN npm ci --only=production || true && \
    addgroup -S nodejs && adduser -S nodeuser -G nodejs && \
    chmod -R 755 /app

ENV NODE_ENV=production
EXPOSE 80

USER nodeuser

CMD ["npm","start"]
