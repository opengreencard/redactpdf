# Keep this major version in sync with package.json and the GitHub Actions
# workflow.
FROM node:26-trixie-slim

# PDF tools: poppler (pdftoppm) renders pages and qpdf decrypts them. The
# renderer runs in pdf-renderer/pdfTools.ts. In production it runs as a sidecar
# container from this same image, with the app's secrets left out.
#
# Fonts: PDFs often name fonts that aren't embedded, so poppler substitutes
# them through fontconfig.
# - The MS core fonts cover Arial, Times New Roman, and similar.
# - pdf-renderer/fontconfig.conf lets each font answer to its PostScript name
#   and style stem, such as TimesNewRomanPS for TimesNewRomanPS-BoldMT. PDFs
#   use those names for fonts they don't embed.
# - pdfTools.ts writes the stems and builds the cache at first render.
# - Carlito and Caladea are metric-compatible with Calibri and Cambria, and
#   fontconfig aliases those names to them.
#
# ttf-mscorefonts-installer is in the contrib component and downloads the MS
# fonts during the build. The debconf line accepts the Microsoft EULA.
#
# Keep in sync with the PDF tool packages in these files:
# - .github/workflows/ci.yml
# - README.md
RUN sed -i 's/^Components: main$/Components: main contrib/' /etc/apt/sources.list.d/debian.sources && \
  apt-get update && \
  echo 'ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true' | debconf-set-selections && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    poppler-utils \
    qpdf \
    fontconfig \
    ttf-mscorefonts-installer \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    fonts-croscore \
    fonts-liberation \
    fonts-liberation2 \
    fonts-dejavu-core \
    fonts-urw-base35 \
    fonts-noto-core \
    fonts-freefont-ttf && \
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
