---
title: "Ncrack"
path: "scanners/Ncrack"
category: "scanner"
type: "Authentication"
state: "developing"
appVersion: "0.7"
usecase: "Network authentication bruteforcing"
---

Ncrack is a high-speed network authentication cracking tool. It was built to help companies secure their networks by proactively testing all their hosts and networking devices for poor passwords. Security professionals also rely on Ncrack when auditing their clients. Ncrack was designed using a modular approach, a command-line syntax similar to Nmap and a dynamic engine that can adapt its behaviour based on network feedback. It allows for rapid, yet reliable large-scale auditing of multiple hosts.

To learn more about the Ncrack scanner itself visit [Ncrack GitHub] or [Ncrack Website].

<!-- end -->

## Ncrack Deployment & Configuration

#### Setup with custom files:
If you want to use your own files within the ncrack scan, you have to create a secret first:

```bash
kubectl create secret generic --from-file users.txt --from-file passwords.txt ncrack-lists
```

<b> IMPORTANT: Use an extra empty line at the end of your files, otherwise the last letter of the last line will be omitted (due to a bug in k8) </b>


Now we created a secret named "ncrack-lists". 
But before we can use the files, we have to install the ncrack ScanType:

```bash
cat <<EOF | helm install ncrack ./scanners/ncrack --values -
scannerJob:
  extraVolumes:
    - name: ncrack-lists
      secret:
        secretName: ncrack-lists
  extraVolumeMounts:
    - name: ncrack-lists
      mountPath: "/ncrack/"
EOF
```

This enables us now to refer to our files via "/ncrack/<file>" in the scan.yaml.

For a full example on how to configure ncrack with your custom files against a ssh service, see the "dummy-ssh" example.

#### Basic setup (no files can be mounted):

The Ncrack ScanType can be deployed via helm:

```bash
helm upgrade --install ncrack ./scanners/ncrack/
```

#### Delete Ncrack ScanType:

```bash
helm delete ncrack
```

#### Options

All additional options for ncrack can be found on [Ncrack Documentation].

---


> 🔧 The implementation is currently work-in-progress and still undergoing major changes. It'll be released here once it has stabilized.

[Ncrack Website]: https://nmap.org/ncrack/
[Ncrack GitHub]: https://github.com/nmap/ncrack
[Ncrack Documentation]: https://nmap.org/ncrack/man.html
