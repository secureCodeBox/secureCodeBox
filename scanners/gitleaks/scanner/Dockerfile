ARG scannerVersion=latest
FROM securecodebox/gitleaks:${scannerVersion}
COPY wrapper.sh /wrapper.sh
ENTRYPOINT [ "sh", "/wrapper.sh" ]
