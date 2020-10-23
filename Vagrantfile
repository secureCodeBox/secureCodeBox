#
# All in one Vagrant box.
#

Vagrant.configure("2") do |config|
  base_dir = File.dirname(__FILE__)

  config.vm.box = "debian/buster64"
  config.vm.hostname = "securecodebox"
  # Don't sync anything onto the box.
  config.vm.synced_folder base_dir, '/vagrant', disabled: true

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
    c.vmx["numvcpus"] = "2"
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

  # Do not automaticall install VirtualBox guest additions, if available.
  # Because this would take lot of time with additional reboot.
  # Necessary for environments w/ guest additions available.
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.no_install = true
  end
end
