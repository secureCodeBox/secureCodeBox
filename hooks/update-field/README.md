---
title: "Update Field"
path: "hooks/update-field"
category: "hook"
type: "dataProcessing"
state: "released"
usecase: "Updates fields in finding results."
---

<!-- end -->

## Deployment

Installing the _Update Field_ hook will add a ReadOnly Hook to your namespace. 

```bash
helm upgrade --install ufh ./hooks/update-field/ --set attribute.name="category" --set attribute.value="my-own-category"
```

> 🔧 The secureCodeBox core team is working on this, we will keep you informed.
