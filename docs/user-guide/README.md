# Using the secureCodeBox

## First startup

1.  Access the engine [http://your-docker-host:8080/](http://localhost:8080)
2.  Choose your admin credentials.

![Admin setup ](..//resources/first_startup_screen.png)

## First time login

1.  Access the engine [http://your-docker-host:8080/](http://localhost:8080)
2.  Access the admin login from the dropdown menu behind the 🏠 in the top right corner

![Admin Section](../resources/adminSection.png)

3.  Use the following credentials for your first login:

```
Username: choosen Username
Password: choosen Password
```

4.  Navigate to the user management via the top bar

![User management](../resources/userManagement.png)

5.  Select the TODO account
6.  Select `Account`from the left panel
7.  Change the default logins for the TODO account
8.  Create new users via user management as shown in step `4`

## Starting Scan-Processes using the Camunda UI

1.  After logging in via [http://your-docker-host:8080/](http://localhost:8080), the welcome screen will be displayed. From here you can start the different Camunda Web Apps.

-   `Cockpit` is used for monitoring running and ended process instances.
-   `Admin` is used for managing users, groups and authorizations.
-   `Tasklist` is used for user tasks and starting processes.

![Camunda Welcome Screen](../resources/welcome.png)

2.  Click on `Tasklist` to see the list of open tasks.

![Camunda Tasklist Screen](../resources/tasklist.png)

3.  Next select `Start process` to open the list of available processes.

![List of process definitions](../resources/processDefinitions.png)

4.  Choose the desired scan process to display the form for configuring the scan. In this example `Port Scan` has been used.

![Configure a scan](../resources/configureScan.png)

5.  Finally, start the scan process by clicking `Start`.

> **Note**: A more detailed guide for the Camunda UI can be found [here][camundawebapps].

[camundawebapps]: https://docs.camunda.org/manual/7.8/webapps/

## Starting Scan-Processes using the REST-API

In order to start a scan via the REST-API, send a PUT-Request to the following URL:
`/box/processes/$PROCESS_KEY` with `$PROCESS_KEY` being the id defined in the respective BPMN file. As an example, the URL for starting an Nmap scan with SecureCodeBox running on localhost would be `http://localhost:8080/box/processes/nmap-process`.

The scanning target is set within the payload:

```json
[
    {
        "name": "Local Test",
        "location": "localhost",
        "attributes": {
            "NMAP_PARAMETER": "-O"
        }
    }
]
```

You can check out a more detailed API documentation in the Swagger Docs of the secureCodeBox Engine. The Swagger Docs come together with the secureCodeBox Engine. You can access it at `http://localhost:8080/swagger-ui.html#/scan-process-resource` (you need to have the engine running on localhost).

### In Depth Scan Examples

1.  [Scanning modern Single Page Applications like OWASP JuiceShop using arachni](./usage-examples/arachni-juice-shop-example.md)
2.  [Scanning Server Rendered Applications like BodgeIt Store using arachni](./usage-examples/arachni-bodgeit-example.md)
