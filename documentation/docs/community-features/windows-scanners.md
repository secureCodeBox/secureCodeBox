---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Windows Scanners"
sidebar_label: Windows Scanners
path: "docs/community-features/windows-scanners"
sidebar_position: 1
---

# Integrating Windows™ Scanners into the secureCodeBox

:::note
Because Windows is still the most famous OS available, there is a need for Windows-specific security tools. 
Of course, it would be nice to integrate them with the *secureCodeBox* as well. 
Our attempts are still in an experimental-like status, but we would like to share them with you and encourage you
to take one step further towards a working solution.
Please let us know if you have suggestions or even working examples, but please be aware that we cannot 
guarantee to provide in-depth support on experimental topics.
:::

## PingCastle

PingCastle is an open-source tool to scan a company's active directory. It is able to identify potential security
risks and anomalies, regarding password settings, account privileges and much more. However, as active directory
has emerged as a tool from microsoft, PingCastle is also a tool that runs only on Windows.
You can read more about our struggle to make it work on linux in this
[blog post](https://www.securecodebox.io/blog/2021/08/09/integrating-windows-scanners).
This "tutorial" is directed towards a solution that uses a virtual machine inside an ubuntu container to run
PingCastle in this machine. Sounds like inception? It pretty much is, but it is the only solution known to date to us 
that enables us to run it on a linux container.

You can find these steps and additional template files, such as a **working parser** to convert PingCastle 
healthchecks to scb findings, on a dedicated [branch](https://github.com/secureCodeBox/secureCodeBox/tree/pingcastle) 
in our main repository. Feel free to use it as a starting point.

## General architecture of the solution

Docker \<- Ubuntu \<- VirtualBox \<- Windows VM \<- PingCastle

That means that we run PingCastle in our Windows VM that runs in a virtualbox inside an ubuntu container.

More specifically:
* Ubuntu 18 with systemd enabled (FROM jrei/systemd-ubuntu)
* Virtual Box (tested version: 6.1.16_Ubuntur140961, use latest version)
* Windows 10 VM
  If you use it for non-commercial usages and want to test our solution, you can use a trial version (Expires in 90 days):
  [Windows 10 VM Trial](https://developer.microsoft.com/de-de/windows/downloads/virtual-machines/) (Choose VirtualBox image)
* PingCastle 2.9.2.1 (latest)

## Step-By-Step Walkthrough

Now let's dive into the crazy inception and have our system run a linux docker with windows!
All you need is a Linux base system (preferably Ubuntu, we did not test any other linux distro!) where **Virtual Box
is installed.**

### 1. Setting up the Windows 10 VM
In the first step we will set up our Windows VM. In order to do that you need to run it as a virtual machine in
Virtual Box. If you have downloaded the trial version mentioned above, you simply have to import it in Virtual Box
and start the VM.
Our goal is to have a Windows VM that logs in automatically on start-up, is connected to the network where the active
directory is running and is able to run a PingCastle scan.

<details>
<summary> WindowsVM Setup </summary>

0. Install your specific language & keyboard Settings (optional, but can be useful)

1. Allow login without password for VirtualBox:
   [Source Stackoverflow](https://stackoverflow.com/questions/35372516/vboxmanage-error-the-specified-user-was-not-able-to-logon-on-guest)

"Run" -> "gpedit.msc".
Windows Settings -> Security Settings -> Local Policies -> Security Options -> Accounts:
Limit local account use of blank passwords to console logon only -> set it to DISABLED.

2. Establish VPN Connection to the network where the AD is located (if not used in the network anyway)

If the container is always running in the company's network, this step should not be necessary.
<details>
<summary>Otherwise you have to automatically connect to the VPN on startup</summary>

Automatically connect to VPN on startup:
- Create a file "autoConnectVPN.bat"
- Add the following line to the file:
  c:\windows\system32\rasdial.exe "domain" [/domain:domain.de]
- Go To: C:\Users\USER\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
- Create shortlink to the autoConnectVPN.bat file

**Unfortunately, we experienced that this does not always work with PingCastle. The connection was established,
but PingCastle refused to find the network. We provide a very dirty workaround that is not by any means error-prove.
It should only be used if all other possibilities failed, and you want to test if the docker container is working at all.**
```
Dirtiest workaround: Use python to automatically click on the connection symbol:
1. Install python 3.x and pip, add python to path, then (python -m) pip install pywin32

2. Create a script that just clicks "manually" on the connection symbols. (Read the mouse coordinates and click them)
```
</details>

3. Hang VM into the domain:

   3.1 Open Powershell.exe as Administrator(!)

   3.2 Type in the following command: Add-Computer -DomainName domain.de -NewName PingCastleVM

   3.3 Type in your credentials (Username is the domain shortcut, e.g. pschmidt; Password is your regular PW)

   3.4 If you are succesfull, this message shows:
   WARNING: The changes will take effect after you restart the computer (your computer name).

   3.5 Restart VM

   3.6 Check date&time, maybe the timezone has to be set manually to have a correct system time

4. Download necessary tools:

   4.1 [Download PingCastle](https://github.com/vletoux/pingcastle/releases/download/2.9.2.1/PingCastle_2.9.2.1.zip)

   4.2 Unzip to path: *C:\PingCastle*

   4.3 We found it most useful and the easiest way not to call PingCastle directly but via a script.
   So create healthcheck.cmd in *C:\PingCastle* :
```
cd C:\PingCastle
PingCastle.exe --healthcheck --server domain.com
``` 
*cd* necessary because otherwise guestcontrol will use a wrong default path.

Finally, check if you can successfully scan your domain via the script!

5. Install Guest Additions for Virtual Box

6. Set Auto-Login:
   [Source: Tech-Faq](https://www.tech-faq.net/windows-10-autologin-einrichten/)

Create file and execute:
```
Windows Registry Editor Version 5.00

 [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Passwordless\Device]
"DevicePasswordLessBuildVersion"=dword:00000000
```

7. Disable recovery modes to avoid that the VM gets stuck upon startup. (This step is optional and can for certain
   be further improved)

   7.1 Open cmd as administrator

   7.2
   ```
   reagentc /info
   reagentc /disable   
   ```

8. Now check if you can run your VM in headless mode and execute a scan:
```
    vboxmanage startvm WinVM --type headless
    vboxmanage showvminfo WinVM | grep "State" # should be "Running"
    vboxmanage guestcontrol WinVM run --exe "c:\\PingCastle\\healthcheck.cmd" --username USER
```

9. Finally, you must export the modified appliance using VirtualBox (.ova)

</details>

### 2. Docker Set-Up for Ubuntu with WindowsVM
Next, we will integrate our created WindowsVM into an Ubuntu docker container.
We hereby use an already existing Ubuntu18 container that has *systemd* enabled,
which is crucial for virtual box to function.

<details>
<summary>Docker Setup</summary>

Dockerfile:
```
FROM jrei/systemd-ubuntu

# VirtualBox
RUN apt-get update \
  && apt-get -y install wget \
  && apt-get -y install gnupg2 \
  && apt-get -y install systemd \
  && apt-get -y install python3 \
  && apt-get -y install software-properties-common \
  && apt-get -y install unzip \
  && wget -q https://www.virtualbox.org/download/oracle_vbox_2016.asc -O- | apt-key add - \
  && wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | apt-key add - \
  && add-apt-repository "deb https://download.virtualbox.org/virtualbox/debian bionic contrib" \
  && apt-get -y update \
  && apt-get -y install linux-headers-generic \
  && mkdir WindowsVM \
  && apt-get -y install virtualbox


# Add run pingcastle script
ADD run_pingcastle_healthcheck.py run_pingcastle_healthcheck.py
```

Now we have to do some manual configurations, so we must run the container. In --device, you have to provide the
path where vboxdrv on your base system is located.
```
docker run -d --privileged \
  --name windocvm --network=host \
  --device /dev/vboxdrv:/dev/vboxdrv \
  -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
  -v /tmp:/tmp -it windocvm
```


Next, copy the WindowsVM to the created container:
```
docker cp WindowsVM/WinVM.ova windocvm:WindowsVM/WinVM.ova
```

Change to the running container and import and start the VM:
```
  docker exec -it windocvm /bin/bash
  
  cd WindowsVM \
  && vboxmanage import WinVM.ova \
  && vboxmanage list vms \
  && vboxmanage startvm WinVM --type headless \
  && vboxmanage showvminfo WinVM | grep "State"
```

After that you can push the docker image to your own docker repository or proceed with the local image.
</details>

### 3. Create docker container to handle the scan
From the now created docker container, we can create a new one that has all the attributes from the one above and is
able to execute our scan with a python script. This container can finally be added to the cluster and perform the
automated scans.

<details>
<summary>Dockerfile</summary>

```
FROM docker.yourrepo.com/windocvm:latest

ENTRYPOINT ["python3", "run_pingcastle_healthcheck.py"]
```
</details>
