FROM owasp/zap2docker-stable:2.10.0
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
# Copy doesn't respect USER directives so we need to chown and to do that we need to be root
USER root
RUN chown -R zap:zap /zap/*
#Change back to zap at the end
USER zap
