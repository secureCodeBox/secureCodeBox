# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

ARG scannerVersion=latest
FROM aquasec/kube-hunter:${scannerVersion}
COPY wrapper.sh /wrapper.sh
ENTRYPOINT [ "sh", "/wrapper.sh" ]
