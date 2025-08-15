# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS builder
ARG scannerVersion
RUN GOOS="$TARGETOS" GOARCH="$TARGETARCH" CGO_ENABLED=0 go install github.com/ffuf/ffuf/v2@$scannerVersion

RUN mkdir -p /home/ffuf/.config/ffuf
RUN mkdir -p /home/ffuf/.config/ffuf/scraper

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder --chown=root:root --chmod=755 /go/bin/ffuf /usr/local/bin/ffuf
COPY --from=builder --chown=nonroot:nonroot /home/ffuf/.config/ffuf /home/nonroot/.config/ffuf

WORKDIR /home/nonroot

ENTRYPOINT ["/usr/local/bin/ffuf"]
