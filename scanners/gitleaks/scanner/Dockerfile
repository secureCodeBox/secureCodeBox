# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion=latest
FROM zricethezav/gitleaks:${scannerVersion}
USER root
COPY wrapper.sh /wrapper.sh
RUN chmod o+x ./wrapper.sh
USER gitleaks
ENTRYPOINT ["./wrapper.sh" ]
