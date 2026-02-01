# Maverick Blog Editor Dockerfile
# Bun-based build and runtime. Uses Debian (glibc) to avoid rollup optional-deps / musl issues.
# WORKDIR /src (not /app) so Vite alias "/app" -> resolve(cwd,"app") => /src/app, avoiding /app/app/app path clash.
FROM oven/bun:1 AS production-dependencies-env
WORKDIR /src
COPY package.json ./
# Install production dependencies (bun will generate lockfile if needed)
RUN bun install --production || npm install --production

FROM oven/bun:1 AS build-env
WORKDIR /src
ARG VITE_AUTH_URL=http://localhost:3000
ENV VITE_AUTH_URL=${VITE_AUTH_URL}
COPY package.json ./
# Install all dependencies (bun will generate lockfile if needed)
RUN bun install || npm install
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

