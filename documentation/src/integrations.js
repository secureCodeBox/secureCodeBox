// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

export const Hooks = [{
  "title": "Azure Monitor",
  "type": "persistenceProvider",
  "usecase": "Publishes all Scan Findings to Azure Monitor.",
  "path": "docs/hooks/azure-monitor",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Cascading Scans",
  "type": "processing",
  "usecase": "Cascading Scans based declarative Rules.",
  "path": "docs/hooks/cascading-scans",
  "imageUrl": "img/integrationIcons/Cascading-Scans.svg"
}, {
  "title": "DefectDojo",
  "type": "persistenceProvider",
  "usecase": "Publishes all Scan Reports to OWASP DefectDojo.",
  "path": "docs/hooks/defectdojo",
  "imageUrl": "img/integrationIcons/DefectDojo.svg"
}, {
  "title": "Elasticsearch",
  "type": "persistenceProvider",
  "usecase": "Publishes all Scan Findings to Elasticsearch.",
  "path": "docs/hooks/elasticsearch",
  "imageUrl": "img/integrationIcons/Elasticsearch.svg"
}, {
  "title": "Finding Post Processing",
  "type": "dataProcessing",
  "usecase": "Updates fields for findings meeting specified conditions.",
  "path": "docs/hooks/finding-post-processing",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Generic WebHook",
  "type": "integration",
  "usecase": "Publishes Scan Findings as WebHook.",
  "path": "docs/hooks/generic-webhook",
  "imageUrl": "img/integrationIcons/Generic-WebHook.svg"
}, {
  "title": "Notification WebHook",
  "type": "integration",
  "usecase": "Publishes Scan Summary to MS Teams, Slack and others.",
  "path": "docs/hooks/notification-webhook",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Static Report",
  "type": "persistenceProvider",
  "usecase": "Publishes all Scan Findings as HTML Report.",
  "path": "docs/hooks/static-report",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Update Field",
  "type": "dataProcessing",
  "usecase": "Updates fields in finding results.",
  "path": "docs/hooks/update-field",
  "imageUrl": "img/integrationIcons/Update-Field.svg"
}];

export const Scanners = [{
  "title": "Amass",
  "type": "Network",
  "usecase": "Subdomain Enumeration Scanner",
  "path": "docs/scanners/amass",
  "imageUrl": "img/integrationIcons/Amass.svg"
}, {
  "title": "CMSeeK",
  "type": "CMS",
  "usecase": "Automation of the process of detecting the Joomla CMS and its core vulnerabilities",
  "path": "docs/scanners/cmseek",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "doggo",
  "type": "Network",
  "usecase": "DNS client (like dig)",
  "path": "docs/scanners/doggo",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "ffuf",
  "type": "Webserver",
  "usecase": "Webserver and WebApplication Elements and Content Discovery",
  "path": "docs/scanners/ffuf",
  "imageUrl": "img/integrationIcons/ffuf.svg"
}, {
  "title": "Git Repo Scanner",
  "type": "Repository",
  "usecase": "Discover Git repositories",
  "path": "docs/scanners/git-repo-scanner",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Gitleaks",
  "type": "Repository",
  "usecase": "Find potential secrets in repositories",
  "path": "docs/scanners/gitleaks",
  "imageUrl": "img/integrationIcons/Gitleaks.svg"
}, {
  "title": "Kube Hunter",
  "type": "Kubernetes",
  "usecase": "Kubernetes Vulnerability Scanner",
  "path": "docs/scanners/kube-hunter",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Kubeaudit",
  "type": "Kubernetes",
  "usecase": "Kubernetes Configuration Scanner",
  "path": "docs/scanners/kubeaudit",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Ncrack",
  "type": "Authentication",
  "usecase": "Network authentication bruteforcing",
  "path": "docs/scanners/ncrack",
  "imageUrl": "img/integrationIcons/Ncrack.svg"
}, {
  "title": "Nikto",
  "type": "Webserver",
  "usecase": "Webserver Vulnerability Scanner",
  "path": "docs/scanners/nikto",
  "imageUrl": "img/integrationIcons/Nikto.svg"
}, {
  "title": "Nmap",
  "type": "Network",
  "usecase": "Network discovery and security auditing",
  "path": "docs/scanners/nmap",
  "imageUrl": "img/integrationIcons/Nmap.svg"
}, {
  "title": "Nuclei",
  "type": "Website",
  "usecase": "Nuclei is a fast, template based vulnerability scanner.",
  "path": "docs/scanners/nuclei",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Screenshooter",
  "type": "WebApplication",
  "usecase": "Takes Screenshots of websites",
  "path": "docs/scanners/screenshooter",
  "imageUrl": "img/integrationIcons/Screenshooter.svg"
}, {
  "title": "Semgrep",
  "type": "Repository",
  "usecase": "Static Code Analysis",
  "path": "docs/scanners/semgrep",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "SSH-audit",
  "type": "SSH",
  "usecase": "SSH Configuration and Policy Scanner",
  "path": "docs/scanners/ssh-audit",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "SSH",
  "type": "SSH",
  "usecase": "SSH Configuration and Policy Scanner",
  "path": "docs/scanners/ssh",
  "imageUrl": "img/integrationIcons/SSH.svg"
}, {
  "title": "SSLyze",
  "type": "SSL",
  "usecase": "SSL/TLS Configuration Scanner",
  "path": "docs/scanners/sslyze",
  "imageUrl": "img/integrationIcons/SSLyze.svg"
}, {
  "title": "Trivy",
  "type": "Container",
  "usecase": "Container Vulnerability Scanner",
  "path": "docs/scanners/trivy",
  "imageUrl": "img/integrationIcons/Trivy.svg"
}, {
  "title": "Typo3Scan",
  "type": "CMS",
  "usecase": "Automation of the process of detecting the Typo3 CMS and its installed extensions",
  "path": "docs/scanners/typo3scan",
  "imageUrl": "img/integrationIcons/Default.svg"
}, {
  "title": "Whatweb",
  "type": "Network",
  "usecase": "Website identification",
  "path": "docs/scanners/whatweb",
  "imageUrl": "img/integrationIcons/Whatweb.svg"
}, {
  "title": "WPScan",
  "type": "CMS",
  "usecase": "Wordpress Vulnerability Scanner",
  "path": "docs/scanners/wpscan",
  "imageUrl": "img/integrationIcons/WPScan.svg"
}, {
  "title": "ZAP Advanced",
  "type": "WebApplication",
  "usecase": "WebApp & OpenAPI Vulnerability Scanner extend with authentication features",
  "path": "docs/scanners/zap-advanced",
  "imageUrl": "img/integrationIcons/ZAP-Advanced.svg"
}, {
  "title": "ZAP",
  "type": "WebApplication",
  "usecase": "WebApp & OpenAPI Vulnerability Scanner",
  "path": "docs/scanners/zap",
  "imageUrl": "img/integrationIcons/ZAP.svg"
}];
export default {Hooks, Scanners};
