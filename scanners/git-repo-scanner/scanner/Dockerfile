FROM python:3.9.0-alpine
COPY . /scripts/
RUN pip install -r /scripts/requirements.txt
CMD ["/bin/sh"]
WORKDIR /scripts
ENTRYPOINT ["python", "-m", "git_repo_scanner"]
