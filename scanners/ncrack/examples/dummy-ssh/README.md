In this example we execute an ncrack scan against the intentional vulnerable ssh service (dummy-ssh)

#### Initialize ncrack with lists and dummy-ssh

Before executing the scan, make sure to have dummy-ssh installed, and have the proper username & password lists:

```bash
# Create user & password list files, you can edit them later if you want
printf "root\nadmin\n" > users.txt
printf "THEPASSWORDYOUCREATED\n123456\npassword\n" > passwords.txt

# Create a Kubernetes secret containing these files
kubectl create secret generic --from-file users.txt --from-file passwords.txt ncrack-lists

# Install dummy-ssh app. We'll use ncrack to enumerate its ssh username and password
helm install dummy-ssh ./demo-apps/dummy-ssh/ --wait

# Install the ncrack scanType and set mount the files from the ncrack-lists Kubernetes secret
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

#### Troubleshooting:
* <b> Make sure to leave a blank line at the end of each file used in the secret!</b>
* If printf doesn't create new lines, try 'echo -e "..."'
* You can show your existing secrets with 'kubectl get secrets' 
