# Keep this major version in sync with package.json and the GitHub Actions
# workflow.
FROM node:26-trixie-slim

# Ghostscript is used only by the PDF renderer (pdf-renderer/bin/www.ts). In
# production that runs as a sidecar container from this same image, with the
# app's secrets left out of its environment.
RUN apt-get update && apt-get install -y ghostscript && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY patches/ ./patches/
COPY .yarn/releases/ ./.yarn/releases/

RUN node .yarn/releases/yarn-4.14.1.cjs install

COPY . .

ENV NODE_ENV=production
ENV APP_MODE=production

RUN node .yarn/releases/yarn-4.14.1.cjs build

EXPOSE 3000

ENTRYPOINT ["node", "node_modules/.bin/next", "start"]
