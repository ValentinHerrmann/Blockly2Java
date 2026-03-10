FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN mkdir -p custom-generator-codelab
COPY custom-generator-codelab/package*.json ./custom-generator-codelab/
RUN mkdir -p custom-generator-codelab
COPY custom-generator-codelab/package*.json ./custom-generator-codelab/
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build && \
	addgroup -S nodejs && adduser -S nodeuser -G nodejs

# Copy built app from builder stage
COPY --from=builder /app .

# Install production dependencies, set permissions, and switch user
RUN npm ci --only=production || true && \
	chmod -R 755 /app

EXPOSE 8080

USER nodeuser

ENV NODE_ENV=production
EXPOSE 80

CMD ["npm","start"]
