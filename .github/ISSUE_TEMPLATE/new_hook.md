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

- [ ] Create a new Helm Chart with the `helm create new-hook` command in the `hooks` directory (replace `new-hook` with the name of the hook)
- [ ] Add a basic description of your hook Helm chart in the `Chart.yaml`
- [ ] (optional) Add/Edit fields in `values.yaml`
- [ ] Add (optional) a `Dockerfile` for the hook if you do not use the provided [hook-sdk](https://github.com/secureCodeBox/secureCodeBox/tree/main/hook-sdk/nodejs)
- [ ] Implement the hook in `hook.js` and test it in `hook.test.js`
- [ ] Implement a [new integration or E2E test](https://www.securecodebox.io/docs/contributing/integrating-a-hook/integration-tests) for the hook [here](https://github.com/secureCodeBox/secureCodeBox/tree/master/tests/integration)
- [ ] Add a brief overview of the scanner and its configuration options in `.helm-docs.gotmpl`