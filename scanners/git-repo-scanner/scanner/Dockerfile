FROM python:3.9.0-alpine
COPY . /scripts/
RUN pip install -r /scripts/requirements.txt
CMD ["/bin/sh"]
ENTRYPOINT ["python","/scripts/git_repo_scanner.py"]
