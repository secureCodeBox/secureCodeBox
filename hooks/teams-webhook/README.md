# teams-webhook

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: latest](https://img.shields.io/badge/AppVersion-latest-informational?style=flat-square)

Lets you send a findings result summary as webhook to MS Teams, after a scan is completed.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.digest | string | `nil` |  |
| image.registry | string | `"docker.io"` |  |
| image.repository | string | `"scbexperimental/teams-webhook"` |  |
| image.tag | string | `"latest"` |  |
| webhookUrl | string | `"http://example.com"` |  |
