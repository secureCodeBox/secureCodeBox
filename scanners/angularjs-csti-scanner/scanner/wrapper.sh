# If acstis config exists paste it into the acstis script
if [ -f /acstis/config/acstis-config.txt ]; then
  echo "Insert acstis-config file into acstis script"
  awk '{$1=$1}1' /acstis/config/acstis-config.txt | # Trim start end end spaces of each line of the config
  awk -v x=4 '{printf "%" x "s%s\n", "", $0}' | # Add indentation of 4 to every line
  sed -i '/#INSERT CUSTOM OPTIONS HERE/ r /dev/stdin' /acstis/acstis-script.py # Insert config into script
fi
python /acstis/acstis-script.py $@

# If no finding occured generate a empty file for the lurcher
if [ ! -f /home/securecodebox/findings.log ]; then
    touch /home/securecodebox/findings.log
fi
exit 0
