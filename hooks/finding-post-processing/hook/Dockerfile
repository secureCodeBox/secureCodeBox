# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM --platform=$BUILDPLATFORM golang:1.26.2 AS build
WORKDIR /workspace
COPY hook-sdk/golang/go.mod /hook-sdk/golang/go.mod
COPY hooks/finding-post-processing/hook/go.mod ./go.mod
COPY hooks/finding-post-processing/hook/go.sum ./go.sum
RUN go mod download
COPY hook-sdk/golang /hook-sdk/golang
COPY hooks/finding-post-processing/hook ./
ARG TARGETOS TARGETARCH
RUN GOOS="$TARGETOS" GOARCH="$TARGETARCH" CGO_ENABLED=0 go build -a -o finding-post-processing .

FROM gcr.io/distroless/static:nonroot
COPY --from=build /workspace/finding-post-processing /finding-post-processing
ENTRYPOINT ["/finding-post-processing"]
