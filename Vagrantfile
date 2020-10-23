#
# All in one Vagrant box.
#

Vagrant.configure("2") do |config|
  config.vm.box = "debian/buster64"
  config.vm.hostname = "securecodebox"
  # Don't sync anything onto the box.
  config.vm.synced_folder File.dirname(__FILE__), '/vagrant', disabled: true

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

  config.vm.provision :shell, inline: <<-SHELL
    export DEBIAN_FRONTEND="noninteractive"
    apt-get update
    apt-get upgrade -y
    apt-get install -y \
      apt-transport-https \
      ca-certificates \
      gnupg2 \
      curl \
      software-properties-common

    # Install Docker as minikube provider (https://docs.docker.com/engine/install/debian/)
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
    apt-get -y update
    apt-get install -y docker-ce
    systemctl start docker
    usermod -a -G docker vagrant

    # Install minikube (https://minikube.sigs.k8s.io/docs/start/)
    curl -sSLO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
    dpkg -i minikube_latest_amd64.deb
    rm minikube_latest_amd64.deb

    # Install kubectl (https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-using-native-package-management)
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
    echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list
    apt-get update
    apt-get install -y kubectl
  SHELL

  # Do not automaticall install VirtualBox guest additions, if available.
  # Because this would take lot of time with additional reboot.
  # Necessary for environments w/ guest additions available.
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.no_install = true
  end
end
