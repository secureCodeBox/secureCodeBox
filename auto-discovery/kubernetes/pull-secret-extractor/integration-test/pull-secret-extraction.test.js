const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sPodsApi = kc.makeApiClient(k8s.CoreV1Api);

test(
    "Test if initcontainer creates correct secrets",
    async () => {
        let secret;
        try {
            secret = await k8sPodsApi.readNamespacedSecret("test-secret", "integration-test");
        } finally {
            expect(secret).toBeDefined();
        }

    },
    60*1000
)