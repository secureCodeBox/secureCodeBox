# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

import glob
import json
import sys
import base64
import os

from kubernetes import client, config

from docker_image import get_domain_from_docker_image


def main():
    image_id = sys.argv[1]
    temporary_secret_name = sys.argv[2]

    domain = get_domain_from_docker_image(image_id)

    raw_secrets = get_raw_secrets('/secrets')
    correct_secret = get_correct_secret(domain, raw_secrets)

    if correct_secret:
        username, password = get_user_and_password(correct_secret)
        create_temporary_secret(username, password, temporary_secret_name)
        print(f"Created temporary pull secret for domain: '{domain}'")
    else:
        print(f"No secrets found for domain: '{domain}'")


def get_raw_secrets(base_path: str):
    """Reads in files called '.dockerconfigjson' in the path given and return the content of all files called so
    :param base_path: Directory to search for dockerconfigjson files
    :returns: List of secrets found in base_path
    """
    raw_secrets = []
    for file_name in glob.glob(f'{base_path}/**/.dockerconfigjson', recursive=True):
        with open(file_name) as file:
            raw_secret = json.load(file)
            raw_secrets.append(raw_secret)
    return raw_secrets


def get_correct_secret(domain: str, secrets) -> dict[str, str]:
    """Iterates over given list of secrets to find the secret that matches the URL in the given imageID
    :param domain: The domain of the imageID of which the correct secret needs to be identified
    :param secrets: List of secrets
    :returns: Dict containing the secret matching the given imageID
    """
    for secret in secrets:
        for url, data in secret['auths'].items():
            if url == domain:
                return data


def get_user_and_password(raw_secret: dict[str, str]) -> tuple[str, str]:
    """Extracts username and password from a given secret
    :param raw_secret: Dict containing the secret. Should contain key 'auth' (where username and password are
             base64 encoded in a single line like: username:password), or 'username' and 'password' as a separate key
             (also base64)
    :returns: tuple containing username and password both base64 encoded
    :raises KeyError: Structure of given secret does not contain expected structure.
    """
    if 'auth' in raw_secret:
        # secret is in form "username:password" (base64 encoded)
        username_password_combo = decode_base64(raw_secret['auth'])
        tmp_list = username_password_combo.split(":")

        # k8s wants the secrets as base64, so the individual values are converted back to base64
        username = encode_base64(tmp_list[0])
        password = encode_base64(tmp_list[1])
        return username, password

    elif 'username' in raw_secret and 'password' in raw_secret:
        # username and password are already separated and base64 encoded, no need to do more
        username = raw_secret['username']
        password = raw_secret['password']
        return username, password

    else:
        raise KeyError('dockerconfigjson secret does not contain expected structure!')


def decode_base64(raw_string: str) -> str:
    return base64.b64decode(raw_string).decode('utf-8')


def encode_base64(string: str) -> str:
    return base64.b64encode(string.encode('utf-8')).decode('utf-8')


def create_temporary_secret(username: str, password: str, secret_name: str):
    """Creates a secret with name 'secret_name' with 'username' and 'password' as data in given namespace. The secret has an ownerReference to the pod this container is running in.
    :param username: base64 encoded string representing the desired value of the 'username' field in the secret
    :param password: base64 encoded string representing the desired value of the 'password' field in the secret
    :param secret_name: Name of the newly created secret
    """
    config.load_incluster_config()
    v1 = client.CoreV1Api()

    namespace = get_namespace()

    pod_name = get_pod_name()
    pod = v1.read_namespaced_pod(name=pod_name, namespace=namespace)

    secret_data = {'username': username, 'password': password}
    owner_references = client.V1OwnerReference(api_version='v1', name=pod_name, uid=pod.metadata.uid, kind='Pod')
    metadata = client.V1ObjectMeta(name=secret_name, namespace=namespace, owner_references=[owner_references])
    secret_body = client.V1Secret(api_version='v1', kind='Secret', metadata=metadata, data=secret_data, type='Opaque')
    v1.create_namespaced_secret(namespace=namespace, body=secret_body)


def get_pod_name() -> str:
    """Read pod name from environment variable called 'POD_NAME'.
    Should be set like this: https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/"""
    return os.environ['POD_NAME']


def get_namespace() -> str:
    """Read pod name from environment variable called 'NAMESPACE'.
    Should be set like this: https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/"""
    return os.environ['NAMESPACE']


if __name__ == '__main__':
    main()
