# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

#
# All in one Vagrant box for the secureCodeBox.
#

Vagrant.configure("2") do |config|
  base_dir = File.dirname(__FILE__)

  config.vm.box = "debian/bullseye64"
  config.vm.hostname = "securecodebox"

  # We use the same defaults like Docker Desktop.
  memory = 2048
  cpus = 2

  config.vm.provider :virtualbox do |c|
    # https://www.vagrantup.com/docs/providers/virtualbox/configuration
    c.memory = memory
    c.cpus = cpus
  end

  config.vm.provider :vmware_desktop do |c|
    # https://www.vagrantup.com/docs/providers/vmware/configuration
    c.vmx["memsize"] = memory
    c.vmx["numvcpus"] = cpus
  end

  config.vm.provider :hyperv do |c|
    # https://www.vagrantup.com/docs/providers/hyperv/configuration
    c.memory = memory
    c.cpus = cpus
  end

  config.vm.provider :libvirt do |c|
    # https://github.com/vagrant-libvirt/vagrant-libvirt
    c.memory = memory
    c.cpus = cpus
  end

  config.vm.provision :shell, path: "#{base_dir}/bin/install-minikube.sh"
  # Using sudo -g to run the command w/ newly created group from installation w/o the need of relogin.
  # Redirecting STDERR to /dev/null because Minikube print download progress
  # for the images to STDERR which clutters up the Vagrant output w/ error output!
  config.vm.provision :shell, privileged: false, inline: "sudo -g docker minikube start 2>/dev/null"
  # Install everything from secureCodeBox via install script.
  # Hint: The directory where the Vagrantfile lives is mapped into the box under the path /vagrant.
  config.vm.provision :shell, privileged: false, inline: "sudo -g docker /vagrant/bin/install.sh --all"

  # Do not automatically install VirtualBox guest additions, if available.
  # Because this would take lot of time with additional reboot.
  # Necessary for environments w/ guest additions available.
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.no_install = true
  end
end
