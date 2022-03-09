# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM martinhelmich/typo3:9.4 
RUN rm /var/www/html/FIRST_INSTALL \
    && rm -r /var/www/html/typo3conf

COPY ./typo3conf /var/www/html/typo3conf

RUN chown -R www-data.www-data /var/www/html/typo3conf \
    && chmod +rxw /var/www/html/typo3conf/cms-016d0ef9.sqlite
# Login details
  # Username: root
  # Password: supersecret
  # Website runs on port 80
