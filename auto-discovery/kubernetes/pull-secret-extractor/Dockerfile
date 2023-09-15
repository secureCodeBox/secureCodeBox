# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM python:3.11-alpine

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY docker_image.py secret_extraction.py ./
CMD ["python", secret_extraction.py]
