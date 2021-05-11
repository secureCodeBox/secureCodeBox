// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"

	"github.com/pkg/errors"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
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

	log.Println("Starting lurcher")
	log.Printf("Waiting for main container '%s' to complete", mainContainer)
	log.Printf("After scan is completed file '%s' will be uploaded to '%s'", filePath, url.Hostname())

	pod := os.Getenv("HOSTNAME")
	namespace := os.Getenv("NAMESPACE")
	waitForMainContainerToEnd(mainContainer, pod, namespace)

	log.Printf("Uploading result files.")
	log.Printf("Uploading %s", filePath)
	err = uploadFile(filePath, uploadURL)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Uploaded file successfully")
}

func uploadFile(path, url string) error {
	fileBytes, err := ioutil.ReadFile(path)
	size := len(fileBytes)
	log.Printf("File has a size of %d bytes", size)
	if err != nil {
		log.Println("Failed to read file")
		log.Fatal(err)
	}
	req, err := http.NewRequest("PUT", url, bytes.NewReader(fileBytes))
	if err != nil {
		log.Fatal(err)
	}

	client := &http.Client{}

	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode < 300 {
		// all good
		return nil
	}

	log.Printf("File upload returned non 2xx status code (%d)", res.StatusCode)

	bytes, err := httputil.DumpResponse(res, true)
	if err != nil {
		log.Fatal(errors.Wrap(err, "Failed to dump out failed requests to upload scan report to the s3 bucket"))
	}

	log.Println("Failed Request:")
	log.Println(string(bytes))

	return fmt.Errorf("Lurcher failed to upload scan result file. File upload returned non 2xx status code (%d)", res.StatusCode)
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

	for {
		pod, err := clientset.CoreV1().Pods(namespace).Get(pod, metav1.GetOptions{})
		if kerrors.IsNotFound(err) {
			log.Printf("Pod %s not found in namespace %s", pod, namespace)
		} else if statusError, isStatus := err.(*kerrors.StatusError); isStatus {
			log.Printf("Error getting pod %v", statusError.ErrStatus.Message)
		} else if err != nil {
			panic(err.Error())
		} else {
			containerStatuses := pod.Status.ContainerStatuses

			for _, status := range containerStatuses {
				if status.Name == container && status.State.Terminated != nil {
					log.Printf("Main Container Exited. Lurcher will end as well.")
					return
				}
			}
		}

		time.Sleep(500 * time.Millisecond)
	}
}
