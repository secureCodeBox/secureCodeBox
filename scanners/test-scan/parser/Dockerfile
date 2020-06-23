ARG baseImageTag
FROM scbexperimental/parser-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/parser-wrapper/parser/
COPY --chown=app:app ./parser.js ./parser.js