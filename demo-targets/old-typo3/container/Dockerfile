# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM martinhelmich/typo3:9

RUN rm FIRST_INSTALL
COPY ./typo3conf /var/www/html/typo3conf
RUN chown -R www-data.www-data /var/www/html/typo3conf
RUN chmod +rxw /var/www/html/typo3conf/cms-e996413d.sqlite
