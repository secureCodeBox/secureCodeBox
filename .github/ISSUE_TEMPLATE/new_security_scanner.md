---
name: 'New Security Scanner request'
about: 'Suggest an idea for a new security scanner to integrate in this project.'
labels: 'security scanner'
---
## New Scanner implementation request

**Is your feature request related to a problem? Please describe.**
- _A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]_

**Describe the solution you'd like**
- _A clear and concise description of what you want to happen._

**Describe alternatives you've considered**
- _A clear and concise description of any alternative solutions or features you've considered._

**Additional context**
- _Add any other context or screenshots about the feature request here._

## Steps to implement a new scanner
> Hint: A general guide how to implement a new scanner is documented [here]( https://github.com/secureCodeBox/secureCodeBox/blob/master/docs/developer-guide/README.md#developing-own-processes)

### Must have
- [ ] Create a [new public secureCodeBox repository](https://github.com/organizations/secureCodeBox/repositories/new) for the scanner implementation
- [ ] Implement a new scanner microservice an reuse some of the existing stuff, if possible
- [ ] Check if there is a [healthcheck](https://github.com/secureCodeBox/secureCodeBox/blob/master/docs/developer-guide/README.md#healthchecks-for-scanner-microservices) for the microservice implemented
- [ ] Implement a [new basic security process](https://github.com/secureCodeBox/secureCodeBox/blob/master/docs/developer-guide/README.md#developing-a-process-model) for the scanner
- [ ] Update the [docker-compose](https://github.com/secureCodeBox/secureCodeBox/blob/master/docker-compose.yml) files and integrate your new scanner there
- [ ] Update the [user guide](https://github.com/secureCodeBox/secureCodeBox/tree/master/docs/user-guide) and [developer guide](https://github.com/secureCodeBox/secureCodeBox/tree/master/docs/developer-guide)
- [ ] Implement a integration test for the scanner [here](https://github.com/secureCodeBox/secureCodeBox/tree/master/test)

### Should have
- [ ] Update the [CLI examples](https://github.com/secureCodeBox/secureCodeBox/tree/master/cli)
- [ ] Update the [Jenkins Pipeline](https://github.com/secureCodeBox/integration-pipeline-jenkins-examples) examples
- [ ] Update the [OpenShift Container Setup](https://github.com/secureCodeBox/ansible-role-securecodebox-openshift)
