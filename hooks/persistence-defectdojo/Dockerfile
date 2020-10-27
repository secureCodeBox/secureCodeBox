FROM gradle:jdk11 as build
COPY . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle build

# FROM openjdk:11-jre-alpine
# RUN addgroup --system --gid 1001 app && adduser app --system --uid 1001 --ingroup app
# COPY --from=build --chown=app:app /home/gradle/src/build/libs /app
# USER 1001
# CMD ["java", "-jar", "/app/demo-*.jar", "--spring.profiles.active=prod"]

FROM gcr.io/distroless/java:11-nonroot
COPY --from=build --chown=nonroot:nonroot /home/gradle/src/build/libs /app
# TLS Config works around an issue in OpenJDK... See: https://github.com/kubernetes-client/java/issues/854
ENTRYPOINT ["java", "-Djdk.tls.client.protocols=TLSv1.2", "-jar", "/app/defectdojo-persistenceprovider-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=prod"]
