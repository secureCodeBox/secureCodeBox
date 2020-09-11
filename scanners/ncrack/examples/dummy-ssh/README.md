In this example we execute an ncrack scan against the intentional vulnerable ssh service (dummy-ssh)

## Install dummy-ssh

Before executing the scan, make sure to have dummy-ssh installed:

```bash
helm install dummy-ssh ./demo-apps/dummy-ssh/ --wait
```



