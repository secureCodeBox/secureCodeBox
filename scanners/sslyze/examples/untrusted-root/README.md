# SSLyze Scan with Custom CA Certificate

This example demonstrates how to use SSLyze with a custom CA certificate file to validate certificates that are signed by an internal or private Certificate Authority (CA).

## Overview

When scanning internal services or applications that use certificates signed by a private/internal CA, SSLyze will typically report these certificates as untrusted because the CA is not in the standard trust stores (Mozilla, Apple, Windows, etc.).

By providing a custom CA certificate file using the `--certinfo_ca_file` parameter, you can instruct SSLyze to trust certificates signed by your internal CA, preventing false positive "Untrusted Certificate Root" findings.
