# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.13 as base
RUN apk add wget unzip \
    && wget https://downloads.wordpress.org/plugin/sqlite-integration.1.8.1.zip \
    && unzip sqlite-integration.1.8.1.zip \
    && rm sqlite-integration.1.8.1.zip \
    && mkdir /wp-content/ /wp-content/plugins \
    && mv sqlite-integration/ /wp-content/plugins \
    && mv /wp-content/plugins/sqlite-integration/db.php  /wp-content/ 

FROM wordpress:4
COPY --from=base --chown=33:33 /wp-content/ /var/www/html/wp-content/ 
COPY ./wp-config.php /var/www/html/ 
COPY ./.ht.sqlite  /var/www/html/wp-content/database/.ht.sqlite

# Login details
  # Username: root
  # Password: supersecret
  # Website runs on port 80 
