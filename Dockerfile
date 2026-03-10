FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and attempt build (if project has a build step)
COPY . .
RUN npm run build || true

FROM node:18-alpine
WORKDIR /app

# Copy built app from builder stage
COPY --from=builder /app .

# Install production dependencies if present
RUN npm ci --only=production || true

ENV NODE_ENV=production
EXPOSE 80

CMD ["npm","start"]
