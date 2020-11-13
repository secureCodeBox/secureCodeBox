# Screnshooter entrypoint script to change the result file linux permission after completion.
# Firefox will set the permission in a way which makes it inaccessible to the lurcher otherwise
timeout 60 firefox $@
timeout 60 firefox $@
if [ ! -f /home/securecodebox/screenshot.png ]; then
    touch /home/securecodebox/screenshot.png
fi
chmod a=r /home/securecodebox/screenshot.png
exit 0
