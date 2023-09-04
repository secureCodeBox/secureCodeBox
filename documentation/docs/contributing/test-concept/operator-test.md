---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Operator Testing"
sidebar_position: 2
---
## Operator

### How to create a test
The operator i.e the Kubernetes custom operator that we use for handling the SCB Custom resource definitions (CRDs), uses Ginkgo, a BDD-style Go testing framework (http://onsi.github.io/ginkgo/ to learn more about Ginkgo.).

To test the functionalities of the operator, we create scenarios where the CRDs are in certain states and see how the operator reacts.
Take the following example. Here we try to test whether the operator would retrigger a [ScheduledScan](/docs/api/crds/scheduled-scan) if the corresponding [ScanType](/docs/api/crds/scan-type) is updated.

```go
var _ = Describe("ScanType controller", func() {
	Context("Restarting ScheduledScans on ScanType Config Changes", func() {
		It("Should restart a scheduledScan when the scantype was update", func() {
			ctx := context.Background()
			namespace := "scantype-autorestart-config-change-test"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScan(ctx, namespace, true)

			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace)
			k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
			initialExecutionTime := *scheduledScan.Status.LastScheduleTime

			// wait at least one second to ensure that the unix timestamps are at least one second apart.
			time.Sleep(1 * time.Second)

			By("Update ScanType to trigger rescan")
			var scanType executionv1.ScanType
			k8sClient.Get(ctx, types.NamespacedName{Name: "nmap", Namespace: namespace}, &scanType)
			if scanType.ObjectMeta.Annotations == nil {
				scanType.ObjectMeta.Annotations = map[string]string{}
			}
			scanType.ObjectMeta.Annotations["foobar.securecodebox.io/example"] = "barfoo"
			err := k8sClient.Update(ctx, &scanType)
			if err != nil {
				panic(err)
			}

			By("Controller should set the lastScheduled Timestamp to the past to force a re-scan")
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					panic("ScheduledScan should be present for this check!")
				}

				return scheduledScan.Status.LastScheduleTime.Unix() != initialExecutionTime.Unix()
			}, timeout, interval).Should(BeTrue())
		})
	})
}    
```
We start by creating a context to run the test in. Then, we set the CRDs to their initial state. In this case the CRDs are [ScanType](/docs/api/crds/scan-type) and [ScheduledScan](/docs/api/crds/scheduled-scan).

The function `createScanType` sets the initial state for a `nmap` ScanType. The different metadata are set manually. This is because the test, driven by Ginkgo, does not actually run inside a real cluster. Instead the tests run inside a simulated cluster that allows the isolated testing of the operator. The `createScanType` function would look like the following:

```go
func createScanType(ctx context.Context, namespace string) {
	scanType := &executionv1.ScanType{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "execution.securecodebox.io/v1",
			Kind:       "ScanType",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "nmap",
			Namespace: namespace,
		},
		Spec: executionv1.ScanTypeSpec{
			ExtractResults: executionv1.ExtractResults{
				Location: "/home/securecodebox/nmap.xml",
				Type:     "nmap-xml",
			},
			JobTemplate: batchv1.Job{
				Spec: batchv1.JobSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{
									Name:  "nmap",
									Image: "securecodebox/scanner-nmap",
									Args:  []string{"-oX", "/home/securecodebox/nmap.xml"},
								},
							},
						},
					},
				},
			},
		},
	}
	Expect(k8sClient.Create(ctx, scanType)).Should(Succeed())
}
```
We do the same for the Namespace and ScheduledScan in functions `createNamespace` and `createScheduledScan` accordingly.
Before carrying on with our test, we first have to make sure that the scheduledScan has actually been triggered.
We do this by using the `Eventually` control loop of Ginkgo. As the documentation states: "In the case of Eventually, Gomega polls the input repeatedly until the matcher is satisfied - once that happens the assertion exits successfully and execution continues. If the matcher is never satisfied `Eventually` will time out with a useful error message" (more info [here](https://onsi.github.io/ginkgo/#patterns-for-asynchronous-testing)).

This would look like the following:

```go
func waitForScheduledScanToBeTriggered(ctx context.Context, namespace string) {
	var scheduledScan executionv1.ScheduledScan
	By("Wait for ScheduledScan to trigger the initial Scan")
	Eventually(func() bool {
		err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
		if errors.IsNotFound(err) {
			panic("ScheduledScan should be present for this check!")
		}

		return scheduledScan.Status.LastScheduleTime != nil
	}, timeout, interval).Should(BeTrue())
}
```
Afterwards, we get the scheduledScan CRD from our context and save it to the `scheduledScan` variable, whilst taking note of the initial execution time of the ScheduledScan. This helps us determine whether the scheduledScan was retriggered or not.


In the same way that we set the initial metadata for the CRDs, we will now update the ScanType to hopefully trigger a rescan.

For better test workflow visibility, the different sections of a test are seperated by the keyword "by", which describes what each section does. The scanType update is done in the `By("Update ScanType to trigger rescan")` section.

In the following section we then check whether the timestamp of ScheduledScan execution time has changed. If it has changed, it means that the ScheduledScan has been retriggered.
We use the `Eventually` control loop again to check for the fulfillment of our condition i.e comparing the context's scheduledScan last schedule time and the initial execution time.

### How to run a test

Running the test is easy through our makefiles. In the operator folder (securecodebox/operator), it is sufficient to run 
```bash
cd operator
make test
```
to execute a test run of the operator.

If you are using VS Code, and you wish to also be able to use the IDE and Debug your code, you can use the following launch options:

```json
//launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Package",
            "type": "go",
            "request": "launch",
            "mode": "test",
            "program": "${workspaceFolder}/operator/controllers/execution",
            "args": ["-test.v"],
            "env": {"KUBEBUILDER_ASSETS": "${workspaceFolder}/operator/testbin/bin"}
        }
    ]
}
```
You may need to adjust the `program` and `env` paths according to your workspace. Make sure to run `make test` once before debugging to ensure that the needed binaries in the `bin` folder are downloaded.