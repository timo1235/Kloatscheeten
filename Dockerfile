# -- Build frontend --
FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/

RUN npm ci --workspace=shared --workspace=frontend

COPY shared/ shared/
COPY frontend/ frontend/

RUN npm run build --workspace=frontend

# -- Production --
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/

RUN npm ci --workspace=shared --workspace=server --omit=dev

COPY shared/ shared/
COPY server/ server/
COPY --from=frontend-build /app/frontend/dist server/frontend/dist

ENV PORT=11000
EXPOSE 11000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:11000/api/health || exit 1

CMD ["node", "--experimental-strip-types", "server/index.ts"]
