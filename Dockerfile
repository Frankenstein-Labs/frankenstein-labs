# This image is for the official Coder control plane. Workspace compute is external.
FROM golang:1.24-bookworm AS build
WORKDIR /src
COPY vendor/coder /src
RUN make build/coder_linux_amd64

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl git openssh-client terraform && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/build/coder_linux_amd64 /usr/local/bin/coder
EXPOSE 7080
ENV CODER_HTTP_ADDRESS=0.0.0.0:7080
CMD ["/usr/local/bin/coder", "server"]
