FROM alpine:3.12
RUN apk add --no-cache nmap=7.80-r2 nmap-scripts=7.80-r2
RUN addgroup --system --gid 1001 nmap && adduser nmap --system --uid 1001 --ingroup nmap
USER 1001
CMD [nmap]
