# Keep this major version in sync with package.json and the GitHub Actions
# workflow.
FROM node:26-trixie-slim

RUN apt-get update && apt-get install -y graphicsmagick ghostscript && \
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
