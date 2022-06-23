# Parser SDK

The Parser SDK provides Parser functionalities that are used by all Scanners like starting the corresponding Parser, enriching the Scan Status in Kubernetes with Parser Results and adding additional attributes to the "Findings.json".

## Running Locally

As the Parser SDK is not executed on its own but rather used in the Parser Images that are then used to install Scanners with helm, you can run the Parser SDK in combination with a Scanner by:

1. Build the Parser SDK Image
2. Build the Parser for a specific Scanner (like nikto) using the Image from the previous step
3. Install the helm chart for the Scanner you chose using the Parser Image from the previous step
4. Run the Scanner -> implicity runs the Parser SDK

Here an example for building the Nikto Scanner with the local Parser-SDK. It assumes your current path is the root of the secureCodeBox directory:

```bash
# build the parser sdk image and give it a tag name
docker build ./parser-sdk/nodejs -t securecodebox/parser-sdk-nodejs:local-dev

# build the parser image with the parser sdk we just built
docker build ./scanners/nikto/parser -t securecodebox/parser-nikto:local-dev --build-arg namespace=securecodebox --build-arg baseImageTag=local-dev

# upgrade the release with the parser image we just built
helm upgrade nikto scanners/nikto --install --set parserImage.repository=securecodebox/parser-nikto,parserImage.tag=local-dev
```

If you add a scan configuration called "scan-config.yaml" to the current directory (nikto examples [here](https://www.securecodebox.io/docs/scanners/nikto#demo-juice-shop)) you can run the Scan with:

```bash
kubectl apply -f scan-config.yaml
```
