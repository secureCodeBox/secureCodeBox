# persistence-defectdojo

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.9.0](https://img.shields.io/badge/AppVersion-1.9.0-informational?style=flat-square)

The defectdojo persistence provider persists secureCodeBox scan results into defectdojo.

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| defectdojo.auth.apiKey | string | `""` | API v2 Key (just the key) |
| defectdojo.auth.username | string | `"admin"` |  |
| defectdojo.url | string | `"http://defectdojo-django.default.svc"` |  |
| image.repository | string | `"docker.io/j12934/hook-defectdojo"` | Hook image repository |
| image.tag | string | `nil` |  |
