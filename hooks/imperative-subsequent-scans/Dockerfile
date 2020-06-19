# This image doesn't install the hooks dependencies, as it only has the @kubernetes/client-node dependencies which is already installed via the hook-sdk

ARG baseImageTag
FROM scbexperimental/hook-sdk-nodejs:${baseImageTag:-latest}
WORKDIR /home/app/hook-wrapper/hook/
COPY --chown=app:app hook.js scan-helpers.js ./
