FROM python:3.9.0-alpine
COPY git_repo_scanner.py /scripts/git_repo_scanner.py
RUN pip install PyGithub python-gitlab
CMD ["/bin/sh"]
ENTRYPOINT ["python","/scripts/git_repo_scanner.py"]
