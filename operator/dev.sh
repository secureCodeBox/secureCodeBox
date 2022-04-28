docker run --name $MINIO_DOCKER_NAME -d --rm -p $S3_ENDPOINT:9000 -p 127.0.0.1:9001:9001 -e MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY -e MINIO_SECRET_KEY=$MINIO_SECRET_KEY minio/minio server /data --console-address ":9001"
sleep 5
docker run --rm --link $MINIO_DOCKER_NAME:minio -e MINIO_BUCKET=$S3_BUCKET --entrypoint sh minio/mc -c "\
  mc config host add myminio http://$S3_ENDPOINT \$MINIO_ENV_MINIO_ACCESS_KEY \$MINIO_ENV_MINIO_SECRET_KEY && \
  sleep 5 && \
  mc mb myminio/\$MINIO_BUCKET \
  "
