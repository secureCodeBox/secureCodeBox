# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.11
RUN addgroup --system --gid 1001 test && adduser test --system --uid 1001 --ingroup test
USER 1001
CMD [cat]
