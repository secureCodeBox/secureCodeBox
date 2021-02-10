FROM ubuntu:20.04
ARG scannerVersion=latest

RUN apt-get update \
    && apt-get install ncrack=$scannerVersion+debian-1build1 -y \
    && rm -rf /var/lib/apt/lists/*

CMD [ "ncrack" ]

