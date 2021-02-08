ARG scannerVersion=latest
FROM aquasec/kube-hunter:${scannerVersion}
COPY wrapper.sh /wrapper.sh
ENTRYPOINT [ "sh", "/wrapper.sh" ]
