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

# Providing own processes
Just put your `custom-process.jar` to the  `./plugins` folder.

# Developing own processes

