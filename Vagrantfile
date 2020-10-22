#
# All in one Vagrant box.
#

Vagrant.configure("2") do |config|
  config.vm.box = "debian/buster64"
  config.vm.hostname = "securecodebox"
  # Don't sync anything onto the box.
  config.vm.synced_folder File.dirname(__FILE__), '/vagrant', disabled: true

  config.vm.provision :shell, inline: <<-SHELL
    export DEBIAN_FRONTEND="noninteractive"
    apt-get update
    apt-get upgrade -y 
  SHELL

  # Do not automaticall install VirtualBox guest additions, if available.
  # Because this would take lot of time with additional reboot.
  # Necessary for environments w/ guest additions available.
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.no_install = true
  end
end
