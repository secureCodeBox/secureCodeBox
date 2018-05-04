# Nmap Network Scanner

The Nmap Network Scanner is a microservice that comes with
the default scanprocess collection
of the SecureCodeBox and utilizes the 
[Nmap Security Scanner](https://nmap.org/).
The main purpose of the scanner is to identify open ports, 
active hosts, active services or operating systems running 
on a target system and using that information to find security vulnerabilities. 
In addition there are lots of other powerful features
like the [Nmap Scripting Engine](https://nmap.org/book/nse.html) 
for example, which can be used to write your own scripts
and run them against a specified target. For a detailed 
description of Nmap please refer to the [Nmap Website](https://nmap.org/).

## Configuration

When the scanner is started the following variables need
to be configured:

* `NMAP_CONTEXT`: The business context under which the scan should be executed
* `NMAP_TARGET`: The scanner target (e.g. localhost, 132.145.77.11, example.com, etc.)
* `NMAP_TARGET_NAME`: Specifies a name for the target (Used in the Results).
* `NMAP_CONFIGURATION_TYPE`: _default_ or _advanced_. When set to _advanced_, additional
options can be specified. 
* `PROCESS_MARK_FALSE_POSITIVE`: Specifies if an additional task should be executed, which checks
for false-positive results

For information how to start a scanner see [Starting Scan Processes](https://github.com/secureCodeBox/engine/wiki/Starting-Scan-Processes)

### Advanced Configuration

If the `NMAP_CONFIGURATION_TYPE` is set to _advanced_, you have the 
option to change the `NMAP_TARGET` again.
Furthermore additional options for the Nmap parameters 
can be defined. The most important options are: 

* `-p` xx: Scan ports of the target. Replace xx with a single port number or
a range of ports.
* `-PS`, `-PA`, `-PU` xx: Replace xx with the ports to scan. TCP SYN/ACK or 
UDP discovery.
* `-sV`: Determine service and version info.
* `-O`: Determine OS info.
* `-A`: Determine service/version and OS info.
* `-script` xx: Replace xx with the script name. Start the scan with the given script.
* `--script` xx: Replace xx with a coma-separated list of scripts. Start the scan with the given scripts.

A list of options is available in the input form of the scanner configuration.
For a detailed explanation refer to the [Nmap Reference Guide](https://nmap.org/book/man.html).

## Results

Like all SecureCodeBox scanners the Nmap scanner returns a report which contains a list of findings. Each of the findings contains the following entries:
* `id`
* `name`
* `description`
* `category`
* `osiLayer`
* `severity`
* `reference`
* `hint`
* `location`
* `attributes`

For a detailed description of these fields, refer to [Add reference here, when existing]().

The `attributes` field contains the following:

* `port`: When an open port is found, this specifies the port number
* `ip_address`: The IP Address of the scanned host
* `mac_address`: The MAC Address of the scanned host
* `protocol`: The protocol, which was used by the scanner
* `start`: The start time of the scan 
* `end`: The end time of the scan
* `state`: The state of the port (open, filtered, closed, unfiltered)
* `service`: The service running on the port

Note: The `PROCESS_RAW_FINDINGS` field of the Camunda process contains the unparsed and unfiltered XML-output of the Nmap scan.
