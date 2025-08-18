# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Announcing secureCodeBox v5.0.0: Major Modernization and Breaking Changes"
authors: [jannik_hollenbach]
tags:
  - secureCodeBox
  - v5
  - release
  - breaking-changes
  - modernization
description: secureCodeBox v5.0.0 brings significant modernization with scanner updates, CommonJS to ESM migration, and important infrastructure changes including MinIO deployment updates.
---

We're excited to announce the release of secureCodeBox v5.0.0! This major version brings significant modernization efforts, performance improvements, and important breaking changes that strengthen the foundation of our security scanning platform.

<!-- truncate -->

## Major Breaking Changes

### Scanner Ecosystem Overhaul

We've made significant changes to our scanner lineup to improve performance and maintainability:

**Removed Scanners:**
- `zap-baseline-scan` and `zap-advanced` - replaced by the more powerful `zap-automation-framework`
- `amass` - replaced by `subfinder`. While amass is an amazing tool, its recent focus on becoming a standalone platform/database for attack surfaces made integration and updates in secureCodeBox increasingly challenging
- `kubeaudit` - users should migrate to `trivy` with Kubernetes mode
- `typo3scan`, `doggo`, and `cmseek` - removed due to maintenance overhead

**New Addition:**
- **`subfinder`** - A very good replacement for subdomain discovery that's also generally quicker and produces similar results to previous tools. This represents a significant improvement in our subdomain enumeration capabilities.

### CommonJS to ESM Migration: A Technical Leap Forward

One of the most significant technical improvements in v5.0.0 is the complete migration of all parsers and hooks from CommonJS to ECMAScript Modules (ESM). This modernization effort brings several benefits:

- **Performance Improvements**: ESM provides better tree-shaking and optimization opportunities, leading to reduced CPU load and faster execution times
- **Modern JavaScript Support**: Enables us to leverage the latest JavaScript features and maintain compatibility with modern Node.js versions
- **Dependency Updates**: As part of this migration, we've updated to `@kubernetes/client-node v1.x` and other modern dependencies
- **Future-Proofing**: ESM is the standard for JavaScript modules, ensuring long-term compatibility and maintainability

This migration required significant refactoring work but results in a more robust and performant codebase that will serve as a solid foundation for future developments.

### MinIO Infrastructure Changes: Ensuring Stability

We've replaced the Bitnami MinIO subchart with a direct MinIO deployment due to upstream stability issues. The upstream minio/charts and images were no longer providing a stable environment, requiring us to implement a more reliable solution.

**Important Migration Notes:**
- **Data Migration**: Data will NOT be migrated automatically from previous MinIO deployments. However, since secureCodeBox's S3 storage is designed for temporary file storage during scan runtime, this is usually not an issue
- **Backup Recommendation**: For users with important data, we recommend performing a backup before upgrading
- **Production Environments**: Continue using external S3-compatible storage solutions for production deployments

### Additional Breaking Changes

- **Kubernetes RBAC**: Renamed ClusterRole from `manager-role` to `securecodebox-manager-role` for better naming consistency
- **Trivy Scope**: Changed default Kubernetes scope from cluster to namespace for improved security posture
- **Elasticsearch**: Dropped integrated Elasticsearch and Kibana Helm charts, changed default index from `scbv2` to `scb`

## Significant Performance Improvements

Beyond the breaking changes, v5.0.0 includes impressive performance enhancements achieved by bundling the parser & hook SDK:

- **Reduced CPU Load**: Up to 5x reduction in CPU usage across parsers and hooks
- **Faster Execution**: Parser and hook execution times improved by up to 2x
- **Enhanced Security**: Updated security contexts and resource configurations for better container security
- **Scanner Updates**: Multiple scanner versions updated including gitleaks, nuclei, semgrep, and trivy

These performance improvements represent some of the most significant optimizations in secureCodeBox's history, directly impacting resource efficiency and scan completion times.

## Kubernetes Service AutoDiscovery Enhancement

We've migrated the Kubernetes Service AutoDiscovery feature to use the ZAP Automation Framework, providing better integration and more consistent scanning capabilities.

## Migration Guide

For detailed migration instructions and breaking change information, please refer to our [full release notes](https://github.com/secureCodeBox/secureCodeBox/releases/tag/v5.0.0) on GitHub.

**Key Migration Steps:**
1. Review removed scanners and update your scan configurations
2. Plan for MinIO data migration if using persistent storage
3. Update any custom RBAC references to the new ClusterRole names
4. Test scanner replacements (especially `subfinder` for `amass` users)

## Looking Forward

Version 5.0.0 represents a significant milestone in secureCodeBox's evolution. The modernization efforts, particularly the ESM migration and infrastructure updates, provide a solid foundation for future innovations while improving performance and maintainability.

We encourage all users to carefully review the breaking changes and plan their migration accordingly. As always, our community is ready to help with any questions or issues you encounter during the upgrade process.

For the complete changelog and technical details, visit the [v5.0.0 release page](https://github.com/secureCodeBox/secureCodeBox/releases/tag/v5.0.0) on GitHub.

Happy scanning! 🔍