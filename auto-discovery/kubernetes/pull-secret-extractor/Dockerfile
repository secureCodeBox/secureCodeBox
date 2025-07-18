# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM python:3.13-alpine

RUN addgroup -g 1001 nikto \
  && adduser -G nikto -s /bin/sh -D -u 1001 nikto
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY --chown=root:root --chmod=755 docker_image.py secret_extraction.py ./
USER 1001
CMD ["python", "secret_extraction.py"]
