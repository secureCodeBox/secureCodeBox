FROM alpine:3.11
RUN apk add --no-cache nmap=7.80-r1 nmap-scripts=7.80-r1
RUN addgroup -S nmap && adduser -S -g nmap nmap
USER nmap
CMD [nmap]