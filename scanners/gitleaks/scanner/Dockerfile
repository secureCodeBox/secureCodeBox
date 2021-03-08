ARG scannerVersion=latest
FROM zricethezav/gitleaks:${scannerVersion}
COPY wrapper.sh /wrapper.sh
ENTRYPOINT [ "sh", "/wrapper.sh" ]
