FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies and install root packages (allow scripts to run as root)
COPY package*.json ./
RUN apk add --no-cache bash build-base python3 libc6-compat git && mkdir -p custom-generator-codelab
COPY custom-generator-codelab/package*.json ./custom-generator-codelab/
RUN npm ci --unsafe-perm

# Copy source and build
COPY . .
# Remove any pre-existing build artifacts from the repository to force a fresh build
# If SKIP_ONLINE_IDE_BUILD is set, assume a prebuilt `build/` may be supplied and keep it
ARG SKIP_ONLINE_IDE_BUILD=0
RUN if [ "$SKIP_ONLINE_IDE_BUILD" = "1" ]; then echo "Keeping existing custom-generator-codelab/build (SKIP_ONLINE_IDE_BUILD=1)"; else rm -rf custom-generator-codelab/build || true; fi
# Ensure project files are writable for any npm scripts that create node_modules or artifacts
RUN chmod -R a+rwX /app || true
ENV NODE_OPTIONS=--max_old_space_size=2048
RUN npm run build

# Normalize build output: webpack production outputs to `dist`, but the runtime
# expects `custom-generator-codelab/build`. Copy `dist` into `build` when
# present so the container always serves the correct app artifacts.
RUN if [ -d custom-generator-codelab/dist ]; then \
            rm -rf custom-generator-codelab/build || true; \
            mkdir -p custom-generator-codelab/build && \
            cp -r custom-generator-codelab/dist/* custom-generator-codelab/build/ || true; \
        fi

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
EXPOSE 8080

USER nodeuser

CMD ["npm","start"]
