FROM node:24.14.1-bookworm-slim

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
  librsvg2-dev

USER 1000:1000

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain stable -y
#RUN rustup default stable

CMD ["bash"]

