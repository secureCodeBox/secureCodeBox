# Extending secureCodeBox

## Developing own processes

### Implementing your first scanner as a microservice

The scanner services are the part of the secureCodeBox which are executing the scans. These services have three responsibilities:

1. Fetch scan tasks and their configuration from the secureCodeBox Engine. This is done via the Rest API of the engine.
2. Run the scan. This can be done in multiple different variants like running shell scripts, calling a programmatic api, RPC, Rest APIs etc.
3. Submit scan results back to the secureCodeBox Engine.

The entire functionality of a scanner is summed up in the following flow diagram:

![Scanner functionality](../resources/scanner-functionality.svg "Scanner functionality flow diagram")

You can implement your scanner microservice in whatever language you want. We implemented our scanners using Java, JavaScript (NodeJS) and Ruby. If you choose to use NodeJS we published an [npm package](https://www.npmjs.com/package/@securecodebox/scanner-scaffolding) which handles the communication with the engine for you.

### Using the Scan Job Api

The secureCodeBox Scan Job Api is used to fetch new tasks from the engine.
The API is documented using Swagger. You can check this out by running the engine and navigate to `/swagger-ui.html#/scan-job-resource`.

### Developing a process model

To integrate a new scanner into the secureCodeBox Engine you need to write a plugin. This plugins contains a BPMN Model of your Scan Process. This Model defines the following things:

* Name and Id of the process.
* A topic name for the task queue (e.g. `nikto_webserverscan`). Every scanner has one (ore more) queues on which all scan jobs are inserted by the engine and then completed by the scan services. In Camunda these are called External Service Tasks.
* Transformation of results. If the scanner returns results in a format incompatible with the secureCodeBox Finding Format, you can transform the data inside the engine before persisting it. (Note that the transformation can also be done in the Scan Service)

To get quickly up and running on creating a new process model you can simply copy an existing one. You can find the [prepackaged processes here](https://github.com/secureCodeBox/engine/tree/master/scb-scanprocesses). If you want to get started with a simple one, take a look at the nikto process. This process only contains the bare minimum of logic in the process model. 

To edit these models, Camunda provides a free modelling tool for the BPMN models which you can [download here](https://camunda.com/download/modeler/).

If you copied a process model you need to change a few things according to your new scan process:

* Update the **name** and **id** of the process. You can edit this in side-panel on the right hand side of the Camunda Editor once you have opened the model.
* Update the **topic-name** of the External Service Task.
* Update the references to configuration **forms** to your own configuration forms. See [Creating configuration forms](#Creating configuration forms 
)

When you finished the Process Modell compile it to a jar. 
> **Note**: Take a look at the prepackaged scan processes to see how.

Just put your `custom-process.jar` to the `./plugins` folder. This folder is also registered as docker volume. So you can add the plugin without rebuilding the docker container.

### Creating configuration forms

> **Note**: If you just want to run the scans automatically via the api you don't need forms.

When some parts of the process should be directly controlled by the user you will need a `User Task`. These are tasks which can not be completed automatically but by a human. In the secureCodeBox these are normally configuration tasks. Most secureCodeBox processes contain three different forms:

1. `Target Configuration`: Lets users define the minimum configuration needed to perform a scan.
2. `Advanced Configuration`: Lets users configure advanced configuration options
3. `Scan Results`: Displays the results of the scan to the user.

The Forms are HTML Documents with embedded AngularJS code for custom logic.

### SDK to the rescue

There are some parts, both logic and definitions, which are shared across processes. These pieces are extracted into its own module. You can include this module in your own code and reuse it.

> **Note**: If you write your scanner in a JVM language you can use the report and finding definitions inside the scanner not just inside the engine plugin.
