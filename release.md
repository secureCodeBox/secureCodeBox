# A list of steps to ensure after a new secureCodeBox release

- Ensure and update all charts with a new release chart version x.x.x-alpha1
- Add the minor or major release version to the `helm-docs` template: `*/.helm-docs.gotmpl` 
  - search for: "- tagged releases, e.g. `3.0.0`, `2.9.0`, `2.8.0`, `2.7.0`"
- Ensure the all chart annotations specific for ArtifactHub are correct (e.g. release notes)
- Check/update ./SECURITY.md
- Check Service Tweet & Slack Notification

::: Note
In the future we should try to automate this steps also for each release!
:::
