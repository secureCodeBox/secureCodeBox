FROM python:3.9.0-alpine
COPY . /zap-extended/
RUN pip3 install -r /zap-extended/requirements.txt
RUN addgroup --system --gid 1001 zap-extended && adduser zap-extended --system --uid 1001 --ingroup zap-extended
USER 1001
CMD ["/bin/sh"]
WORKDIR /zap-extended
ENTRYPOINT ["python3", "-m", "scbzapv2"]
