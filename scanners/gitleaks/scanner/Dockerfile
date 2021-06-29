# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion=latest
FROM zricethezav/gitleaks:${scannerVersion}
RUN adduser -S -H -u 1001 gitleaks
COPY wrapper.sh /wrapper.sh
RUN chmod o+x ./wrapper.sh
USER gitleaks
ENTRYPOINT ["./wrapper.sh" ]
