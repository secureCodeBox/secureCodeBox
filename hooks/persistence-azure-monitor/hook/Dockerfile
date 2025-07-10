# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

ARG baseImageTag
ARG namespace

FROM ${namespace:-securecodebox}/hook-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/hook-wrapper/hook/
COPY --chown=root:root --chmod=755 ./hook.js ./hook.js