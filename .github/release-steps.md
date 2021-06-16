## A list of steps to ensure after a new release
- Ensure and update all charts with a new release chartversion x.x.x
- Add the minor or major release version to the `helm-docs` template: `./.helm-docs/template.gotmpl
- ensure the all chart annotations specific for ArtifactHub are correct (e.g. release notes)
- check SECURITY.md

::: Note

In the future we should try to automate this steps also for each release!

:::