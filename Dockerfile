## syntax=docker/dockerfile:1.4
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE=http://localhost:3004
ARG NEXT_PUBLIC_SITE_URL=https://properties.crmdost.com

ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

COPY . .
RUN NODE_ENV=production npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3006

COPY --from=builder /app .

EXPOSE 3006

CMD ["npm", "run", "start"]
