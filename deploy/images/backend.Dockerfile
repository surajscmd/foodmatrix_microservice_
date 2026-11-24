FROM node:22-bookworm-slim
ARG SERVICE
ARG PRISMA_CONFIG=prisma.config.ts

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY backend/${SERVICE}/package*.json ./
RUN npm ci --include=dev
COPY backend/${SERVICE}/ ./
COPY deploy/scripts/kafka-topics.cjs ./
ENV PRISMA_CONFIG=${PRISMA_CONFIG}
RUN DATABASE_URL=postgresql://generate:generate@127.0.0.1:5432/generate \
    ./node_modules/.bin/prisma generate --config "$PRISMA_CONFIG" && npm run build
USER node
CMD ["npm", "run", "start:prod"]
