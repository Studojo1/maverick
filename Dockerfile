# Maverick Blog Editor Dockerfile
# Bun-based build and runtime. Uses Debian (glibc) to avoid rollup optional-deps / musl issues.
# WORKDIR /src (not /app) so Vite alias "/app" -> resolve(cwd,"app") => /src/app, avoiding /app/app/app path clash.
FROM oven/bun:1 AS production-dependencies-env
WORKDIR /src
COPY package.json ./
# Copy bun.lockb if it exists (preferred), otherwise package-lock.json
COPY bun.lockb* ./
# Install production dependencies
# If bun.lockb exists, use it; otherwise bun will create it from package.json
RUN if [ -f bun.lockb ]; then bun install --frozen-lockfile --production; else bun install --production; fi || npm install --production

FROM oven/bun:1 AS build-env
WORKDIR /src
ARG VITE_AUTH_URL=http://localhost:3000
ENV VITE_AUTH_URL=${VITE_AUTH_URL}
COPY package.json ./
# Copy bun.lockb if it exists (preferred), otherwise package-lock.json
COPY bun.lockb* ./
# Install all dependencies
# If bun.lockb exists, use it; otherwise bun will create it from package.json
RUN if [ -f bun.lockb ]; then bun install --frozen-lockfile; else bun install; fi || npm install
COPY . .
RUN bun run build || npm run build

# Run with Node: React Router server uses renderToPipeableStream etc.; Bun's react-dom/server stub lacks them.
FROM node:20-bookworm-slim
WORKDIR /src
ENV PORT=3002
ENV NODE_ENV=production
COPY package.json ./
# Copy node_modules from production dependencies stage
COPY --from=production-dependencies-env /src/node_modules /src/node_modules
# Copy build output
COPY --from=build-env /src/build ./build
# Copy scripts for migration jobs (copied into apps/maverick/scripts before build)
COPY --from=build-env /src/scripts ./scripts
EXPOSE 3002
CMD ["npx", "react-router-serve", "./build/server/index.js"]

