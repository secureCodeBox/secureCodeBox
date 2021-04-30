import os
import pytest
import requests

from requests.exceptions import ConnectionError

def is_responsive(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return True
    except ConnectionError:
        return False

@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    return os.path.join(str(pytestconfig.rootdir), "tests", "docker-compose.yaml")

@pytest.fixture(scope="session")
def get_bodgeit_url(docker_ip, docker_services):
    """Ensure that HTTP service is up and responsive."""

    # `port_for` takes a container port and returns the corresponding host port
    port = docker_services.port_for("bodgeit", 8080)
    url = "http://{}:{}".format(docker_ip, port)
    docker_services.wait_until_responsive(
        timeout=30.0, pause=0.1, check=lambda: is_responsive(url)
    )
    return url

@pytest.fixture(scope="session")
def get_juiceshop_url(docker_ip, docker_services):
    """Ensure that HTTP service is up and responsive."""

    # `port_for` takes a container port and returns the corresponding host port
    port = docker_services.port_for("juiceshop", 3000)
    url = "http://{}:{}".format(docker_ip, port)
    docker_services.wait_until_responsive(
        timeout=30.0, pause=0.1, check=lambda: is_responsive(url)
    )
    return url

@pytest.fixture(scope="session")
def get_zap_url(docker_ip, docker_services):
    """Ensure that HTTP service is up and responsive."""

    # `port_for` takes a container port and returns the corresponding host port
    port = docker_services.port_for("zap", 8090)
    url = "http://{}:{}".format(docker_ip, port)
    docker_services.wait_until_responsive(
        timeout=30.0, pause=0.1, check=lambda: is_responsive(url)
    )
    return url

def test_all_services_available(get_bodgeit_url, get_juiceshop_url, get_zap_url):
    response = requests.get(get_bodgeit_url + "/bodgeit/")
    assert response.status_code == 200
    
    response = requests.get(get_juiceshop_url + "/#/")
    assert response.status_code == 200

    response = requests.get(get_zap_url + "/UI/core/")
    assert response.status_code == 200