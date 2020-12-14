FROM python:3.6-alpine
COPY acstis-script.py /acstis/acstis-script.py
COPY wrapper.sh /wrapper.sh
RUN apk add --update --no-cache g++ gcc libxslt-dev
RUN pip install https://github.com/tijme/angularjs-csti-scanner/archive/master.zip
ENTRYPOINT [ "sh", "/wrapper.sh" ]
