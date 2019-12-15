FROM golang:alpine AS builder

RUN apk add git

WORKDIR /lurcher/
COPY go.mod go.sum main.go ./
RUN go build main.go

FROM alpine

RUN addgroup -S lurcher_group && adduser -S -g lurcher_group lurcher_user
# --chown="lurcher_user:lurcher_group"

COPY --from=builder /lurcher/main /lurcher/main
RUN chmod +x /lurcher/main

USER lurcher_user

CMD ["/lurcher/main"]
