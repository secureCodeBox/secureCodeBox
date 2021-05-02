FROM python:3.9.0-alpine
COPY . /zap-extended/
RUN pip3 install -r /zap-extended/requirements.txt
CMD ["/bin/sh"]
WORKDIR /zap-extended
ENTRYPOINT ["python3", "-m", "scbzapv2"]
