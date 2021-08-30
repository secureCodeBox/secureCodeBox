"""
SPDX-FileCopyrightText: 2021 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
"""

"""
This script starts a pingcastle healthcheck scan in the docker container, that has virtual box running a windows vm with
pingcastle. If the VM is not running, it tries to start it. Otherwise, it will directly call the script in the VM to
run the scan. In the end, it will transfer the created result file to the host container.
"""

import os
import time
import pathlib
import subprocess
from shutil import copyfile

# Check if Windows VM is already running

running_vm = subprocess.Popen("vboxmanage showvminfo WinVM | grep 'State'", shell=True, stdout=subprocess.PIPE)

state_output = str(running_vm.stdout.read())
running_vm.stdout.close()

if "running" in state_output:
    print("Windows VM already running, skipping start.")
else:
    # Start Windows VM
    print("Starting WindowsVM..!")
    start_vm = subprocess.Popen("vboxmanage startvm WinVM --type headless ", shell=True, stdout=subprocess.PIPE)
    start_vm.wait()
    start_output = str(start_vm.stdout.read())

    if start_vm.returncode == 0 and "successfully started" in start_output:
        print("Windows VM successfully started!")
        print("Waiting for VM to be running..")
        while "running" not in state_output:
            time.sleep(1)
            running_vm = subprocess.Popen("vboxmanage showvminfo WinVM | grep 'State'", shell=True,
                                          stdout=subprocess.PIPE)
            state_output = str(running_vm.stdout.read())

        print("Windows VM is running!")
        for i in range(90):
            print("Waiting until VM is all set up:", 90-i)
            time.sleep(1)

# Start PingCastle Scan:
print("Waiting for scan to start..")
time.sleep(5)

print("Running PingCastle Healthcheck for domain.com")
pingcastle_scan = subprocess.Popen("vboxmanage guestcontrol WinVM run --exe "
                                   "'c:\\PingCastle\\healthcheck.cmd' --username USER",
                                   shell=True,
                                   stdout=subprocess.PIPE,
                                   bufsize=1)
lines = []
for line in iter(pingcastle_scan.stdout.readline, b''):
    print(line)
    lines.append(str(line))
pingcastle_scan.stdout.close()
pingcastle_scan.wait()

success_message = "Task Perform analysis for domain.com completed"
if len(lines) == 0 or success_message not in lines[-1]:
    print("Something went wrong with the scan.. See lines:", lines)
else:
    print("PingCastle Healthcheck successfully finished!")

    print("Grapping generated .xml and .html files..")
    # Remove all files if scan directory already exists:
    if os.path.isdir("PingCastleReports/"):
        for file in os.listdir("PingCastleReports/"):
            os.remove("PingCastleReports/" + file)
    else:
        os.mkdir("PingCastleReports/")

    vbox_xml_transfer = subprocess.Popen("vboxmanage guestcontrol WinVM copyfrom --target-directory PingCastleReports/ "
                                         "'C:\\PingCastle\\ad_hc_domain.com.xml' --username USER",
                                   shell=True,
                                   stdout=subprocess.PIPE)
    vbox_xml_transfer.wait()

    vbox_html_transfer = subprocess.Popen(
        "vboxmanage guestcontrol WinVM copyfrom --target-directory PingCastleReports/ "
        "'C:\\PingCastle\\ad_hc_domain.com.html' --username USER",
        shell=True,
        stdout=subprocess.PIPE)
    vbox_html_transfer.wait()

    if vbox_html_transfer.returncode == 0 and vbox_xml_transfer.returncode == 0:
        # Verify that files have been transferred:
        for file in os.listdir("PingCastleReports"):
            fname = pathlib.Path("PingCastleReports/" + file)
            assert fname.exists(), f'No such file: {fname}'  # check that the file exists
            if "xml" in file:
                # Copy to standard scb location
                copyfile(fname, "/home/securecodebox/pingcastle-results.xml")

        print("All scan files have been successfully transferred, quitting now.")
    else:
        print("Files have not been successfully transferred.. Exit codes: (xml), (html)",
              vbox_xml_transfer.returncode, vbox_html_transfer.returncode)
