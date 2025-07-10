// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { scan, getKubernetesAPIs } from "../../../tests/integration";

test(
  "should trigger notification",
  async () => {
    await scan(
      "test-scan-notification-web-hook",
      "test-scan",
      ["placeholder"],
      90,
    );

    const WEBHOOK = "http-webhook";
    const NAMESPACE = "demo-targets";

    const { k8sPodsApi } = getKubernetesAPIs();

    function containsPod(item) {
      return item.metadata.name.includes(WEBHOOK);
    }

    let podName;
    await k8sPodsApi
      .listNamespacedPod({
        namespace: NAMESPACE,
      })
      .then((res) => {
        let podArray = res.items.filter(containsPod);
        if (podArray.length === 0) {
          throw new Error(`Did not find Pod for "${WEBHOOK}" Hook`);
        }

        podName = podArray[0].metadata.name;
      });

    const containerName = WEBHOOK;

    const params = {
      podName,
      namespace: NAMESPACE,
      containerName,
    };
    const result = await delayedRepeat(isHookTriggered, params, 1000, 10);

    expect(result).toBe(true);
  },
  3 * 60 * 1000,
);

async function isHookTriggered(params) {
  console.log("Fetch Container Logs...");
  const { k8sPodsApi } = getKubernetesAPIs();
  let containerLog = await k8sPodsApi.readNamespacedPodLog({
    name: params.podName,
    namespace: params.namespace,
    container: params.containerName,
  });
  return containerLog.includes("/slack-notification");
}

const sleep = (durationInMs) =>
  new Promise((resolve) => setTimeout(resolve, durationInMs));

async function delayedRepeat(
  fun,
  functionParamObject,
  intervalInMs,
  maxRetries,
) {
  for (let i = 0; i < maxRetries; i++) {
    const condition = await fun(functionParamObject);
    if (condition) {
      return condition;
    }

    await sleep(intervalInMs);
  }

  throw new Error("Reached max retries");
}
