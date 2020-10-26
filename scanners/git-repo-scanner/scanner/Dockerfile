FROM python:3.9.0-alpine
COPY git-repo-scanner.py /scripts/git-repo-scanner.py
RUN pip install PyGithub python-gitlab
CMD ["/bin/sh"]
ENTRYPOINT ["python","/scripts/git-repo-scanner.py"]
