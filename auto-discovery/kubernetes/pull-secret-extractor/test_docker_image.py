from unittest import TestCase

from docker_image import get_domain_from_docker_image


class Test(TestCase):
    def test_get_domain_from_docker_image_with_no_domain(self):
        test_image = "foo/bar"
        domain = get_domain_from_docker_image(test_image)
        self.assertEqual("docker.io", domain)

    def test_get_domain_from_docker_image_with_dockerio_domain(self):
        test_image = "docker.io/foo/bar"
        domain = get_domain_from_docker_image(test_image)
        self.assertEqual("docker.io", domain)

    def test_get_domain_from_docker_image_with_non_dockerio_domain(self):
        test_image = "test.xyz/foo/bar"
        domain = get_domain_from_docker_image(test_image)
        self.assertEqual("test.xyz", domain)

    def test_get_domain_from_docker_image_with_single_world_image(self):
        test_image = "ubuntu"
        domain = get_domain_from_docker_image(test_image)
        self.assertEqual("docker.io", domain)
