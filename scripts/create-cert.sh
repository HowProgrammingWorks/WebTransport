#!/usr/bin/env sh
set -eu

mkdir -p certs

openssl req -x509 -newkey ec \
  -pkeyopt ec_paramgen_curve:prime256v1 \
  -nodes \
  -keyout certs/server.key \
  -out certs/server.crt \
  -days 13 \
  -subj "/CN=localhost"
