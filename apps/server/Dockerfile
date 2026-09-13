# syntax=docker/dockerfile:1
# Build context is the monorepo root:
#   docker buildx build --platform linux/arm64 -f apps/server/Dockerfile -t server .
FROM node:24-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @dev-workflow/server...
RUN pnpm --filter @dev-workflow/server build
# Produce a self-contained deploy dir (built files + pruned prod node_modules).
RUN pnpm deploy --filter=@dev-workflow/server --prod /app

FROM node:24-slim AS runtime
ENV NODE_ENV=production
ENV SERVER_PORT=3000
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
