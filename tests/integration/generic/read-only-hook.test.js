// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { scan } = require("../helpers");
const k8s = require('@kubernetes/client-node');

test(
  "should trigger a webhook",
  async () => {
    await scan(
      "test-scan-read-only-hook",
      "test-scan",
      [],
      90
    );

    const WEBHOOK = "http-webhook";
    const NAMESPACE = "integration-tests";

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

    function containsPod(item) {
      return item.metadata.name.includes(WEBHOOK)
    }

    let podName;
    await k8sApi.listNamespacedPod(NAMESPACE, 'true').then((res) => {
      let podArray = res.body.items.filter((containsPod));
      if (podArray.length === 0) {
        throw new Error(`Did not find Pod for "${WEBHOOK}" Hook`);
      }

      podName = podArray[0].metadata.name;
    });

    const containerName = WEBHOOK;

    const params = {
      k8sApi,
      podName,
      namespace: NAMESPACE,
      containerName
    }
    const result = await delayedRepeat(isHookTriggered, params, 1000, 10);

    expect(result).toBe(true)
  },
  3 * 60 * 1000
);

async function isHookTriggered(params) {
  console.log("Fetch Container Logs...")
  let containerLog = await params.k8sApi.readNamespacedPodLog(params.podName, params.namespace, params.containerName, false);  
  return containerLog.body.includes("/hallo-welt");
}


const sleep = durationInMs =>
  new Promise(resolve => setTimeout(resolve, durationInMs));

async function delayedRepeat(fun, functionParamObject, intervalInMs, maxRetries,) {
  for (let i = 0; i < maxRetries; i++){
    const condition = await fun(functionParamObject);
    if(condition){
      return condition;
    }

    await sleep(intervalInMs);
  }

  throw new Error("Reached max retries")
}
