# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

legacyDefaultDomain = "index.docker.io"
defaultDomain = "docker.io"
officialRepoName = "library"
defaultTag = "latest"


def get_domain_from_docker_image(name: str) -> str:
    """
    Extracts domain and image from a given docker image. Has the same defaulting behavior when it comes to docker.io image as containerd
    Code adapted from https://github.com/containerd/containerd/blob/20de989afcd2fd4edc20e9b85312e49a8bbe152b/reference/docker/normalize.go#L102-L119
    :param name: docker image
    :return: tuple container domain and image
    """
    try:
        i = name.index('/')
    except ValueError:
        i = -1

    name_slice = name[:i]
    if i == -1 or ':' not in name_slice and '.' not in name_slice and name_slice != 'localhost' and name_slice.lower() == name_slice:
        domain = defaultDomain
    else:
        domain = name[:i]

    if domain == legacyDefaultDomain:
        domain = defaultDomain

    return domain

