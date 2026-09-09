// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	var mainContainer, filePath, uploadURL string

	flag.StringVar(&mainContainer, "container", "primary", "Name of the scan container")
	flag.StringVar(&filePath, "file", "", "Absolute path to the result file of the scan")
	flag.StringVar(&uploadURL, "url", "", "Presigned upload url to upload the scan results")

	flag.Parse()

	if mainContainer == "" {
		log.Fatal("Flag 'container' must be set to a proper value")
	}
	if filePath == "" {
		log.Fatal("Flag 'filePath' must be set to a proper value")
	}
	if uploadURL == "" {
		log.Fatal("Flag 'uploadURL' must be set to a proper value")
	}
	url, err := url.Parse(uploadURL)
	if err != nil {
		log.Fatal("Flag 'uploadURL' is no proper URL")
	}

	log.Println("Starting lurker")
	log.Printf("Waiting for main container '%s' to complete", mainContainer)
	log.Printf("After scan is completed file '%s' will be uploaded to '%s'", filePath, url.Hostname())

	pod := os.Getenv("HOSTNAME")
	namespace := os.Getenv("NAMESPACE")
	waitForMainContainerToEnd(mainContainer, pod, namespace)

	log.Printf("Uploading result files.")
	log.Printf("Uploading %s", filePath)
	err = uploadFileWithRetries(filePath, uploadURL)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Uploaded file successfully")
}

// delays waited before each retry of a failed upload. The number of entries
// defines how often the upload is retried after the initial attempt.
var uploadBackoffs = []time.Duration{1 * time.Second, 3 * time.Second, 5 * time.Second, 10 * time.Second, 30 * time.Second}

// indirection to allow tests to run without actually waiting
var sleep = time.Sleep

// uploadFileWithRetries uploads the file and retries network failures using the
// uploadBackoffs schedule.
func uploadFileWithRetries(path, url string) error {
	attempts := len(uploadBackoffs) + 1

	var err error
	for attempt := 1; attempt <= attempts; attempt++ {
		var retryable bool
		err, retryable = uploadFile(path, url)
		if err == nil {
			return nil
		}

		if !retryable || attempt == attempts {
			break
		}

		backoff := uploadBackoffs[attempt-1]
		log.Printf("Upload attempt %d of %d failed: %v. Retrying in %s", attempt, attempts, err, backoff)
		sleep(backoff)
	}

	return fmt.Errorf("lurker failed to upload scan result file after %d attempts: %w", attempts, err)
}

func uploadFile(path, url string) (error, bool) {
	file, err := os.Open(path)
	if err != nil {
		log.Printf("Failed to open file: %v", err)
		return err, false
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		log.Printf("Failed to get file stats: %v", err)
		return err, false
	}
	size := fileInfo.Size()
	log.Printf("Scan result file has a size of %d bytes", size)

	// Create a new file upload request
	req, err := http.NewRequest("PUT", url, file)
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		return err, false
	}

	req.ContentLength = size
	// with the default TransferEncoding golang sends out the requests for empty files without
	// the required Content-Length header this is valid, but not accepted by S3 compatible APIs
	if size == 0 {
		req.TransferEncoding = []string{"identity"}
	}

	client := &http.Client{}

	res, err := client.Do(req)
	if err != nil {
		var networkErr net.Error
		return err, errors.As(err, &networkErr)
	}
	defer res.Body.Close()

	// Check the response status code
	if res.StatusCode >= 200 && res.StatusCode < 300 {
		// all good
		return nil, false
	}

	resultBytes, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		log.Printf("File upload returned status code %d; failed to read response body: %v", res.StatusCode, readErr)
	} else {
		log.Printf("File upload returned status code %d with response body: %s", res.StatusCode, resultBytes)
	}

	return fmt.Errorf("lurker failed to upload scan result file. File upload returned non 2xx status code (%d)", res.StatusCode), false
}

func waitForMainContainerToEnd(container, pod, namespace string) {
	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err.Error())
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	log.Printf("Waiting for maincontainer to exit.")

	context := context.Background()
	for keepWaitingForMainContainerToExit(context, container, pod, namespace, clientset) {
		time.Sleep(500 * time.Millisecond)
	}
}

func keepWaitingForMainContainerToExit(context context.Context, container string, podName string, namespace string, clientset *kubernetes.Clientset) bool {
	pod, err := clientset.CoreV1().Pods(namespace).Get(context, podName, metav1.GetOptions{})
	if apierrors.IsNotFound(err) {
		log.Printf("Pod %s not found in namespace %s", pod, namespace)
	} else if statusError, isStatus := err.(*apierrors.StatusError); isStatus {
		log.Printf("Error getting pod %v", statusError.ErrStatus.Message)
	} else if err != nil {
		panic(err.Error())
	}

	return !mainContainerExited(container, pod.Status.ContainerStatuses)
}

func mainContainerExited(container string, containerStatuses []corev1.ContainerStatus) bool {
	for _, status := range containerStatuses {
		if status.Name == container && status.State.Terminated != nil {
			log.Printf("Main Container exited. Lurker will end as well.")
			return true
		}
	}
	return false
}
