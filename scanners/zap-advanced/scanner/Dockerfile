# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM python:3.9.0-alpine
COPY . /zap-client/
RUN pip3 install -r /zap-client/requirements.txt
RUN addgroup --system --gid 1001 zap-client && adduser zap-client --system --uid 1001 --ingroup zap-client
USER 1001
CMD ["/bin/sh"]
WORKDIR /zap-client
ENTRYPOINT ["python3", "-m", "zapclient"]
