# Using the secureCodeBox

### Local setup

1. Clone the repository `git clone git@github.com:secureCodeBox/secureCodeBox-v2-alpha.git`
2. Ensure you have node.js installed
   * On MacOs with brew package manager: `brew install node`

## Deployment

Each scanType can be deployed via helm:

```bash
helm upgrade --install <scannerName> ./scanners/<scannerName>/
```

follwing...