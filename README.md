# Running secureCodeBox
  
### Cloning
```bash
git clone https://github.com/secureCodeBox/secureCodeBox
cd secureCodeBox
```
### Prerequisites
 * Minimal Docker version 18.03.0 is required.
 * Docker-Compose is required.

### Docker-Compose
The docker-compose file can be used to launch a secureCodeBox instance. It starts the following components:

#### Engine
  * The engine itself
  * NMAP example process
  * ZAP example process
  * Nikto example process
  * ElasticSearch persistence connector
#### Scanner / Spider
  * [NMAP scanner](https://github.com/secureCodeBox/scanner-infrastructure-nmap)
  * [Zap scanner & spider](https://github.com/secureCodeBox/scanner-webapplication-zap)
  * [Nikto scanner](https://github.com/secureCodeBox/scanner-webserver-nikto)
#### Infrastructure
  * ElasticSearch
  * Kibana
  * MySQL

It also mounts the `./plugins` folder as a volume for your custom processes or storage providers. Just pass your custom-processes.jar to that directory. 
```
docker-compose up
```
Running `docker-compose up` uses the default credentials specified in the [`.env`](https://github.com/secureCodeBox/starter/blob/master/.env) file. You can override these by changing the file or setting the environment variables on your system. Before running the SecureCodeBox in a more serious environment you should at least change the following variables:
 * `CAMUNDADB_ROOT_PW` MySQL root password
 * `CAMUNDADB_USER` MySQL username used by the Camunda Engine
 * `CAMUNDADB_PW` MySQL password also used by the Camunda Engine

# Providing own processes
Just put your `custom-process.jar` to the  `./plugins` folder.

# Developing own processes

