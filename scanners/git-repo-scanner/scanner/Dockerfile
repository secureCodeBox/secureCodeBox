# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM docker.io/python:3-alpine
COPY . /scripts/
RUN pip install -r /scripts/requirements.txt
RUN adduser -S -H -u 1001 gitreposcanner
USER 1001
WORKDIR /scripts
ENTRYPOINT ["python", "-m", "git_repo_scanner"]
