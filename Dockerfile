# This image runs the official Coder control plane (coderd). Workspace compute
# is external: this image only runs the server, never workspace workloads.
#
# Coder is consumed as the official, digest-pinned upstream artifact rather than
# rebuilt here. A local `make build/coder_linux_amd64` was evaluated and is not
# reproducible in a clean build context: the vendored coder/coder commit
# (a3f25a4, v2.34.0-rc.0-3903) pins go.mod to Go 1.26 and its Makefile requires
# the full upstream codegen toolchain (protoc 23.4, protoc-gen-go, protoc-gen-go-drpc,
# mockgen, sqlc, quicktype, go generate) plus a pnpm/vite frontend build, and
# scripts/version.sh calls `git describe` inside the tree, which needs the
# submodule's .git directory (a large, token-bearing clone) to be present.
# Building all of that on every deploy is slow and brittle. Rebuilding from
# source can be reintroduced deliberately by pinning that toolchain and copying
# the full .git metadata; the version and digest below must then be kept in sync
# with vendor/coder.
#
# Keep this digest aligned with the Coder version under vendor/coder and with
# render.yaml. Refresh with:
#   docker pull ghcr.io/coder/coder:v2.39.4
#   docker inspect --format '{{index .RepoDigests 0}}' ghcr.io/coder/coder:v2.39.4
FROM ghcr.io/coder/coder:v2.39.4@sha256:2ce6b2ab5b78afe05da8b62184efc7950bb0e53a32dcefab4ef1c9b22c15631a

# The official image already ships the coder binary, Terraform (pinned by
# upstream to match provisioner/terraform/install.go) and git, and runs as the
# non-root `coder` user (uid/gid 1000). Coder's own /healthz endpoint is used.
ENV CODER_HTTP_ADDRESS=0.0.0.0:7080
EXPOSE 7080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail --silent --show-error "http://127.0.0.1:7080/healthz" >/dev/null || exit 1
ENTRYPOINT ["/opt/coder"]
CMD ["server"]
