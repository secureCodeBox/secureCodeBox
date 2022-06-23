---
name: '⚓️ New Hook request'
about: 'Suggest an idea for a new data processing or integration hook in this project.'
labels: 'hook'
---

## ⚓️ New Hook implementation request
<!--
Thank you for contributing to our project 🙌

Before opening a new issue, please make sure that we do not have any duplicates already open. You can ensure this by searching the issue list for this repository. If there is a duplicate, please close your issue and add a comment to the existing issue instead. Also, please, have a look at our FAQs and existing questions before opening a new question.
-->

### Is your feature request related to a problem
<!-- Please describe a clear and concise description of what the problem is. 
     Use commmon user story patterns like https://en.wikipedia.org/wiki/User_story:
      - As a <role> I can <capability>, so that <receive benefit>
      - In order to <receive benefit> as a <role>, I can <goal/desire>
      - As <who> <when> <where>, I <want> because <why>
     For example... As a secureCodeBox user i'm always frustrated when [...] -->

### Describe the solution you'd like
<!-- A clear and concise description of what you want to happen. -->

### Describe alternatives you've considered
<!-- A clear and concise description of any alternative solutions or features you've considered. -->

### Additional context
<!-- Add any other context or screenshots about the feature request here. -->

## Steps to implement a new hook
Hint: A general guide how to implement a new SCB Hook is documented [here](https://www.securecodebox.io/docs/contributing/integrating-a-hook)

- [ ] Create a new folder with the name of the [hook here](https://github.com/secureCodeBox/secureCodeBox/tree/master/hooks)
- [ ] Add a `README.md` and give a brief overview of the scanner and its configuration options.
- [ ] Add a HelmChart and document all configuration options.
- [ ] Add (optional) a `Dockerfile` for the scanner if there is no existing one publicly available on dockerHub.io
- [ ] Use the [Hook-SDK](https://github.com/secureCodeBox/secureCodeBox/tree/master/hook-sdk) to implement a new hook (currently based on NodeJS)
- [ ] Add unit tests with at minimum 80% test coverage
- [ ] Add some example `scan.yaml` and `finding.yaml` files in the example folder
- [ ] Implement a [new integration or E2E test](https://www.securecodebox.io/docs/contributing/integrating-a-hook/integration-tests) for the hook [here](https://github.com/secureCodeBox/secureCodeBox/tree/master/tests/integration)
