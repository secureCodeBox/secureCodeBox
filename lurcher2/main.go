package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

type arrayFlags []string

func (i *arrayFlags) String() string {
	return "my string representation"
}

func (i *arrayFlags) Set(value string) error {
	*i = append(*i, value)
	return nil
}

var filesToUpload = make(arrayFlags, 0)

func main() {
	fmt.Printf("Starting dispatcher")
	namespace := os.Getenv("NAMESPACE")
	podName := os.Getenv("HOSTNAME")

	flag.Var(&filesToUpload, "file", "Some file.")
	scanID := flag.String("scan-id", "", "ID of the current scan")
	mainContainerName := flag.String("main-container-name", "primary", "Name of the scan container.")
	engineAddress := flag.String("engine-address", "http://engine:3000", "Address of the secureCodeBox engine.")
	flag.Parse()

	fmt.Printf("Running for scan: %s\n", *scanID)
	fmt.Printf("Running in namespace: %s\n", namespace)
	fmt.Printf("Scan is performed for engine at: %s\n", *engineAddress)
	fmt.Printf("Waiting for main container '%s' to complete\n", *mainContainerName)

	fmt.Printf("After scan is completed following files are to be uploaded:")
	for _, file := range filesToUpload {
		fmt.Printf("- %s\n", file)
	}
	fmt.Printf("\n")

	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err.Error())
	}
	// creates the clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

WaitForMainContainerToEndLoop:
	for {
		// Examples for error handling:
		// - Use helper functions e.g. errors.IsNotFound()
		// - And/or cast to StatusError and use its properties like e.g. ErrStatus.Message
		pod, err := clientset.CoreV1().Pods("default").Get(podName, metav1.GetOptions{})
		if errors.IsNotFound(err) {
			fmt.Printf("Pod %s not found in default namespace\n", podName)
		} else if statusError, isStatus := err.(*errors.StatusError); isStatus {
			fmt.Printf("Error getting pod %v\n", statusError.ErrStatus.Message)
		} else if err != nil {
			panic(err.Error())
		} else {
			// fmt.Printf("Found %s pod in default namespace\n", podName)
			containerStatuses := pod.Status.ContainerStatuses

			for _, status := range containerStatuses {
				if status.Name == *mainContainerName && status.State.Terminated != nil {
					fmt.Printf("Main Container Exited. Lurcher will end asswell.\n")
					break WaitForMainContainerToEndLoop
				}
				fmt.Printf("Waiting for maincontainer to exit.\n")
			}
		}

		time.Sleep(500 * time.Millisecond)
	}
	clientset = nil
	config = nil

	fmt.Printf("Uploading result files.")
	for _, file := range filesToUpload {
		fmt.Printf(" - Uploading %s", file)
	}
}
