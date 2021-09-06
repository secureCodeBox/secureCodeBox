# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM dorwardv/wordpress-sqlite-nginx-docker@sha256:72cc94ef4f80e0d6d83c5f23eab5f056c74b207bd8a9722570260cde56d28b6e
COPY ./wp.db /usr/share/nginx/html/wp-content/database/.ht.sqlite
RUN chmod +rxw /usr/share/nginx/html/wp-content/database/.ht.sqlite
RUN chown -R www-data.www-data /usr/share/nginx/html/wp-content/database/