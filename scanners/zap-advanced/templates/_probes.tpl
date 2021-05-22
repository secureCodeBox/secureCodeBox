{{/*
    SPDX-FileCopyrightText: 2021 iteratec GmbH

    SPDX-License-Identifier: Apache-2.0
*/}}

{{- define "tcp-socket.liveness" }}
tcpSocket:
  port: {{ .Values.container.port }}
initialDelaySeconds: 15
periodSeconds: 20
{{- end -}}

{{- define "tcp-socket.readiness" }}
tcpSocket:
  port: {{ .Values.container.port }}
initialDelaySeconds: 5
periodSeconds: 10
{{- end -}}
