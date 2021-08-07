# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

FROM localhost:5000/sullo/nikto
COPY wrapper.sh /wrapper.sh
ENTRYPOINT [ "sh", "/wrapper.sh" ]
