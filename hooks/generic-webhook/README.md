---
title: "Generic WebHook"
path: "hooks/generic-webhook"
category: "hook"
type: "integration"
state: "released"
usecase: "Publishes Scan Findings as WebHook."
---

<!-- end -->

## Deployment

Installing the Generic WebHook hook will add a ReadOnly Hook to your namespace. 

```bash
helm upgrade --install gwh ./hooks/generic-webhook/ --set webhookUrl="http://example.com/my/webhook/target"
```
> ✍ This documentation is currently work-in-progress. 