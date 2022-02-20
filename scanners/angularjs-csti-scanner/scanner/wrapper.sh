# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# If acstis config exists paste it into the acstis script
if [ -f /home/angularjscsti/acstis/config/acstis-config.py ]; then
  echo "Insert acstis-config file into acstis script"
  awk '{$1=$1}1' /home/angularjscsti/acstis/config/acstis-config.py | # Trim start end end spaces of each line of the config
  awk -v x=4 '{printf "%" x "s%s\n", "", $0}' | # Add indentation of 4 to every line
  sed -i '/#INSERT CUSTOM OPTIONS HERE/ r /dev/stdin' /home/angularjscsti/acstis/acstis-script.py # Insert config into script
fi
python /home/angularjscsti/acstis/acstis-script.py $@

# If no finding occurred generate a empty file for the lurker
if [ ! -f /home/securecodebox/findings.log ]; then
    touch /home/securecodebox/findings.log
fi
exit 0
