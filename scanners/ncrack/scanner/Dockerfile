FROM ubuntu:20.04

RUN apt-get update \
    && apt-get install ncrack=0.7+debian-1build1 -y \
    && rm -rf /var/lib/apt/lists/*

CMD [ "ncrack" ]

