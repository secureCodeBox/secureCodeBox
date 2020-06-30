FROM alpine:3.12
RUN apk add --no-cache nmap=7.80-r2 nmap-scripts=7.80-r2
RUN addgroup -S nmap && adduser -S -g nmap nmap
USER nmap
CMD [nmap]