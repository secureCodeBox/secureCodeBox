# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

FROM gradle:jdk17 as build
COPY . /home/gradle/src
WORKDIR /home/gradle/src
RUN ./gradlew build -x test

FROM gcr.io/distroless/java17:nonroot
COPY --from=build --chown=nonroot:nonroot /home/gradle/src/build/libs/defectdojo-persistenceprovider-*.jar /app/app.jar
WORKDIR /app
# TLS Config works around an issue in OpenJDK... See: https://github.com/kubernetes-client/java/issues/854
ENTRYPOINT ["java", "-Djdk.tls.client.protocols=TLSv1.2", "-jar", "/app/app.jar"]
