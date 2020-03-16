# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Check for plugins needed
  unless Vagrant.has_plugin?("vagrant-disksize")
    print "  WARN: Missing plugin 'vagrant-disksize'.\n"
    print "  Use 'vagrant plugin install vagrant-disksize' to install.\n"
  end

  unless Vagrant.has_plugin?("vagrant-docker-compose")
    print "  WARN: Missing plugin 'vagrant-docker-compose'.\n"
    print "  Use 'vagrant plugin install vagrant-docker-compose' to install.\n"
  end

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "ubuntu/bionic64"
  config.vm.hostname = "scb-test"

  # Defines a given disk size for this Box.
  # You can search for this plugin at https://github.com/sprotheroe/vagrant-disksize
  config.disksize.size = '40GB'

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 80, host: 80
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.network "forwarded_port", guest: 443, host: 443
  config.vm.network "forwarded_port", guest: 8443, host: 8443
  config.vm.network "forwarded_port", guest: 9200, host: 9200
  config.vm.network "forwarded_port", guest: 5601, host: 5601


  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.33.10"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  #config.ssh.guest_port = 29683

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  # config.vm.synced_folder "../data", "/vagrant_data"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  config.vm.provider "virtualbox" do |vb|
     vb.name = "scb-test"
  
     # Display the VirtualBox GUI when booting the machine
     vb.gui = false
  
     # Customize the amount of memory on the VM:
     vb.memory = "8192"
     vb.cpus = 1
  end


  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y apache2
  # SHELL

  compose_env = Hash.new
  if File.file?(".env")
    array = File.read(".env").split("\n")
    array.each do |e|
      unless e.start_with?("#")
        var = e.split("=")
        compose_env[var[0]] = var[1]
      end
    end
  end

  # If errors occur, try running "vagrant provision" manually
  # after "vagrant up"
  config.vm.provision :docker

  # To use docker_compose as a provisioning tool, install
  # vagrant-docker-compose plugin first. It should also solve the
  # "The '' provisioner could not be found." error:
  # $ vagrant plugin install vagrant-docker-compose
  config.vm.provision :docker_compose,
    project_name: "docker-vagrant",
    yml: [
      "/vagrant/docker-compose.yml",
      "/vagrant/docker-compose.demo.yml"
    ],
    env: compose_env,
    run: "always"
end
