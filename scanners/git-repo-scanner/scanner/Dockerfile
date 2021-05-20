FROM docker.io/python:3-alpine
COPY . /scripts/
RUN pip install -r /scripts/requirements.txt
CMD ["/bin/sh"]
WORKDIR /scripts
ENTRYPOINT ["python", "-m", "git_repo_scanner"]
