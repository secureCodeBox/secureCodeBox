# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM ruby:latest

ARG scannerVersion=v0.5.5
RUN git clone --depth 1 --branch $scannerVersion https://github.com/urbanadventurer/WhatWeb.git \
    && cd WhatWeb \
    && make install

RUN addgroup --system --gid 1001 whatweb && adduser whatweb --system --uid 1001 --ingroup whatweb
USER 1001
CMD ["whatweb"]
