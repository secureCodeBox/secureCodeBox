# scbctl - CLI for secureCodeBox

A handy CLI for interaction with [secureCodeBox](https://github.com/secureCodeBox/secureCodeBox) CustomResources like Scans & ScheduledScans which are tedious to perform using usual `kubectl` & `helm` tooling.

## Installation

```bash
git clone https://github.com/secureCodeBox/secureCodeBox.git
make scbctl

# move `scbctl` binary into a directory in your path
cd scbctl
sudo mv scbctl /usr/local/bin/scbctl
```

## Commands

### scan

Create a new Scan custom resource in the current namespace.

#### Usage

```bash
scbctl scan [scanType] -- [parameters...]
```

#### Arguments

- `scanType`: The type of scan to create.
- `parameters...`: Additional parameters to pass to the scan.

#### Examples

```bash
# Create a new scan
scbctl scan nmap -- scanme.nmap.org

# Create a scan with a custom name
scbctl scan nmap --name scanme-nmap-org -- scanme.nmap.org

# Create with multiple parameters
scbctl scan nuclei -- -target example.com

# Create in a different namespace
scbctl scan --namespace foobar nmap -- -p 80 scanme.nmap.org
```

### trigger

Trigger a new execution (Scan) of a ScheduledScan, ahead of its usual execution schedule.

#### Usage

```bash
scbctl trigger [scheduledScanName] [flags]
```

#### Arguments

- `scheduledScanName`: The name of the ScheduledScan to trigger.

#### Examples

```bash
# Trigger a new scan for a ScheduledScan
scbctl trigger nmap-localhost

# Trigger in a different namespace
scbctl trigger nmap-localhost --namespace foobar
```

## Completion

`scbctl` offers shell completion. See `scbctl completion --help` for instructions on how to set it up in your shell environment.
