# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.13 as base

WORKDIR /html
RUN apk add wget unzip \
&& wget https://github.com/joomla/joomla-cms/releases/download/3.6.5/Joomla_3.6.5-Stable-Full_Package.zip \
&& unzip Joomla_3.6.5-Stable-Full_Package.zip \
&& rm Joomla_3.6.5-Stable-Full_Package.zip

FROM php:7.2-apache
COPY --from=base /html /var/www/html