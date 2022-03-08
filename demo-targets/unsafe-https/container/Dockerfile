# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM nginx:1.17-alpine
COPY index.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/nginx.conf
COPY site.crt /etc/nginx/my-site.com.crt
COPY site.key /etc/nginx/my-site.com.key

EXPOSE 80
EXPOSE 443