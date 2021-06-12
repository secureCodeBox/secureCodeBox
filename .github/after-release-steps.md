## A list of steps to ensure after a new release
- Update all charts with a new chartversion x.x.x-alpha1
- Add next minor or major release to the `helm-docs` template: `./.helm-docs/template.gotmpl
- ensure the all chart annotations specific for ArtifactHub are correct (e.g. release notes)

::: Note

In the future we should try to automate this steps also for each release!

:::