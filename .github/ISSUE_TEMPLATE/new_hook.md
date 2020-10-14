---
name: '⚓️ New Hook request'
about: 'Suggest an idea for a new data processing or integration hook in this project.'
labels: 'hook'
---

<!--
Thank you for contributing to our project 🙌

Before opening a new issue, please make sure that we do not have any duplicates already open. You can ensure this by searching the issue list for this repository. If there is a duplicate, please close your issue and add a comment to the existing issue instead. Also, please, have a look at our FAQs and existing questions before opening a new question.
-->

## New Hook implementation request

**Is your feature request related to a problem? Please describe.**
<!-- A clear and concise description of what the problem is. Ex. I'm always frustrated when [...] -->

**Describe the solution you'd like**
<!-- A clear and concise description of what you want to happen. -->

**Describe alternatives you've considered**
<!-- A clear and concise description of any alternative solutions or features you've considered. -->

**Additional context**
<!-- Add any other context or screenshots about the feature request here. -->

## Steps to implement a new Hook
<!--
Hint: A general guide how to implement a new scanner is documented [here](https://github.com/secureCodeBox/secureCodeBox/tree/master/docs/developer-guide)
-->

- [ ] Create a new folder with the name of the [hook here](https://github.com/secureCodeBox/secureCodeBox/tree/master/hooks)
- [ ] Add a README and give a brief overview of the scanner and its configuration options.
- [ ] Add (optional) a Dockerfile for the scanner if there is no existing one publicly available on dockerHub
- [ ] Use the [Hook-SDK](https://github.com/secureCodeBox/secureCodeBox/tree/master/hook-sdk) to implement a new hook (currently based on NodeJS)
- [ ] Add unit tests with at minimum 80% test coverage
- [ ] Add some example scan.yaml and finding.yaml files in the example folder
- [ ] Implement a new integration test for the hook [here](https://github.com/secureCodeBox/secureCodeBox/tree/master/tests/integration)
