# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Older amass versions are regularly removed from the official docker registry, this is often breaks our builds.
# To prevent this we create a new image based on the official one and push it to our docker registry.

ARG scannerVersion
FROM caffix/amass:${scannerVersion}
# The amass image uses the user "user" with the id 1000, we set it here as a numeric value to allow runAsNonRoot 
USER 1000
ENTRYPOINT ["/bin/amass"]
