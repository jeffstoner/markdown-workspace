FROM node:24.14.1-trixie-slim

# Install system dependencies
RUN apt update && apt install --no-install-recommends --yes libwebkit2gtk-4.1-dev \
  bash \
  ca-certificates \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  rustup

USER 1000:1000

RUN rustup default stable

CMD ["bash"]

