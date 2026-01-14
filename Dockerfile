FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@9.15.9

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/medibook-api/package.json ./apps/medibook-api/
COPY apps/medibook-web/package.json ./apps/medibook-web/

# Copy prisma schema for generation
COPY apps/api/prisma ./apps/api/prisma/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the API
RUN pnpm --filter @doctorq/api build

# Verify build output exists
RUN ls -la /app/apps/api/dist/ || echo "dist folder not found!"

# Expose port
EXPOSE 3001

# Start the API
CMD ["pnpm", "--filter", "@doctorq/api", "start"]
