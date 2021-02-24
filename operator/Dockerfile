# Build the manager binary
FROM golang:1.15 as builder

WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go mod download

# Copy the go source
COPY main.go main.go
COPY apis/ apis/
COPY controllers/ controllers/
COPY internal/ internal/
COPY utils/ utils/

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GO111MODULE=on go build -a -o manager main.go

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
# todo(@J12934) revert back to distroless
FROM alpine
RUN addgroup --system --gid 1001 app && adduser app --system --uid 1001 --ingroup app
USER 1001

ENV VERSION=unkown
ENV TELEMETRY_ENABLED "true"

WORKDIR /
COPY --from=builder /workspace/manager .

ENTRYPOINT ["/manager"]
