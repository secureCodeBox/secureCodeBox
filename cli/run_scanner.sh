#!/bin/bash

echo '                                                                        '
echo '                                          ____                __          ____                     '
echo '                                         /\  _`\             /\ \        /\  _`\                   '
echo '  ____     __    ___   __  __  _ __    __\ \ \/\_\    ___    \_\ \     __\ \ \L\ \    ___   __  _  '
echo ' / ,__\  / __`\ / ___\/\ \/\ \/\` __\/ __`\ \ \/_/_  / __`\  / _` \  / __`\ \  _ <   / __`\/\ \/ \ '
echo '/\__, `\/\  __//\ \__/\ \ \_\ \ \ \//\  __/\ \ \L\ \/\ \L\ \/\ \L\ \/\  __/\ \ \L\ \/\ \L\ \/>  </ '
echo '\/\____/\ \____\ \____\\ \____/\ \_\\ \____\\ \____/\ \____/\ \___,_\ \____\\ \____/\ \____//\_/\_\'
echo ' \/___/  \/____/\/____/ \/___/  \/_/ \/____/ \/___/  \/___/  \/__,_ /\/____/ \/___/  \/___/ \//\/_/'
echo '                                                                                                   '
echo '                                                                        '

echo -e 'SCB scan process runner v1.0\n' 

log(){
	if [ "${TO_STDERR}" ]; then
		>&2 echo "$1"
	else
		echo "$1"
	fi
	echo "$1" >>"${LOG_FILE}"
	if [ $# -eq 2 ]; then
		echo "Response: '$2'" >>"${LOG_FILE}"
	fi
}

info() {
	TO_STDERR=false
	log "INFO: $1"
}

warn() {
	TO_STDERR=false
	log "WARN: $1"
}

error() {
	TO_STDERR=true
	log "ERROR: $1"
}

fatal() {
	TO_STDERR=true
	log "FATAL: $1"
}

is_number() {
	case $1 in
    	''|*[!0-9]*) echo false ;;
    	*) echo true ;;
	esac
}

# No command debugging
set +x

# Read parameters
POSITIONAL=()

CONTEXT=""
AUTH="" # HTTP Basic auth key
SCB_PATH="/box" # SCB API access path
SCB_URL="http://localhost:8080${SCB_PATH}" # SCB API access URL
DEFAULT_MAX_ITER=180 # 180 * 5 sec = 15 min
MAX_ITER="${DEFAULT_MAX_ITER}" # maximum number of iterations
DEFAULT_WAIT_TIME=5 # 5 sec between requests
WAIT_TIME="${DEFAULT_WAIT_TIME}" # waiting time between iterations
SHOW_HELP=false # display help screen?
TARGET_NAME=""
while [[ $# -gt 0 ]]
do
	key="$1"

	case $key in
		-h|--help)
		SHOW_HELP=true
		shift # past argument
		;;
		-w|--wait)
		WAIT_TIME="$2"
		shift # past argument
		shift # past value
		;;
		-i|--max-iter)
		MAX_ITER="$2"
		shift # past argument
		shift # past value
		;;
		-c|--context)
		CONTEXT="$2"
		shift # past argument
		shift # past value
		;;
		-n|--name)
		TARGET_NAME="$2"
		shift # past argument
		shift # past value
		;;
		-p|--payload)
		PAYLOAD_OVERRIDE="$2"
		shift # past argument
		shift # past value
		;;
		-b|--backend)
		SCB_URL="$2${SCB_PATH}"
		shift # past argument
		shift # past value
		shift # past value
		;;
		-a|--auth)
		AUTH="$2"
		shift # past argument
		shift # past value
		;;
		*)    # unknown option / positional argument
		POSITIONAL+=("$1") # save it in an array for later
		shift # past argument
		;;
	esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

SCANNER="$1"
TARGET="$2"

if [ ! -n "${PAYLOAD_OVERRIDE}" ] && [ $# -ne 2 ] || [ "${SHOW_HELP}" == true ]; then
	echo 'SCB scan process runner'
	echo "Usage: ./run_scanner.sh [options] scanner target"
	echo ""
	echo "  Mandatory arguments:"
	echo "    scanner               - scanner type, one of arachni|nmap-nikto|nikto|nmap|sslyze|zap"
	echo "    target                - target URL that shall be scanned, e.g. http://some.target:8080/shop"
	echo ""
	echo "  Options:"
	echo "    -a|--auth username:password"
	echo "        username:password - HTTP Basic authentication credentials for the secureCodeBox Engine. Seperated by a colon."
	echo "    -b|--backend scb_engine_url"
	echo "        scb_engine_url    - secureCodeBox Engine URL, e.g. http://some_scb_engine:8080"
	echo "    -i|--max-iter num_iter"
	echo "        num_iter          - Maximum number of queries to perform (default: ${DEFAULT_MAX_ITER})"
	echo "    -c|--context context"
	echo "        context           - Context to use."
	echo "    -n|--name targetName"
	echo "        targetName        - Name of the target. e.g. 'search-service'"
	echo "    -w|--wait time"
	echo "        time              - Time to wait between queries (in seconds) (default: ${DEFAULT_WAIT_TIME})"
	echo "    -p|--payload path"
	echo "        path              - Path to a json file containing the payload used to create the scan job. This overrides the target configuration."
	echo ""
	echo "  Default 'scb_engine_url' (if none given): 'http://localhost:8080'"
	echo ""
	echo "Examples:"
	echo "  Perform a ZAP scan:"
	echo "    ./run_scanner.sh zap http://some.system/somepath"
	echo "  Perform an NMAP scan:"
	echo "    ./run_scanner.sh nmap some.system"
	echo "  Perform an SSLyze scan using authentication:"
	echo "    ./run_scanner.sh --auth kermit:myPassw0rd sslyze some.system"
	echo "  Perform a Nikto scan using a different backend:"
	echo "    ./run_scanner.sh --backend http://some_scb_engine:8080 nikto some.system"
	echo "  Perform a Arachni scan using a custom target config file"
	echo "    ./run_scanner.sh --payload payloadFile.json arachni"
	
	exit 1
fi

# backup last logfile
LOG_FILE="job_${SCANNER}.log"
if [ -f "${LOG_FILE}" ]; then
	info "Writing backup of last job's log to '${LOG_FILE}.last'"
	mv "${LOG_FILE}" "${LOG_FILE}.last"
fi
echo >"${LOG_FILE}"

# backup last result file
RESULT_FILE="job_${SCANNER}_result.json"
if [ -f "${RESULT_FILE}" ]; then
	info "Writing backup of last job's result to '${RESULT_FILE}.last'"
	mv "${RESULT_FILE}" "${RESULT_FILE}.last"
fi

# backup last payload
PAYLOAD_FILE="job_${SCANNER}_payload.json"
if [ -f "${PAYLOAD_FILE}" ]; then
	info "Writing backup of last job's payload to '${PAYLOAD_FILE}.last'"
	mv "${PAYLOAD_FILE}" "${PAYLOAD_FILE}.last"
fi

if [ -n "${PAYLOAD_OVERRIDE}" ]; then 
	info "Using payload from file[${PAYLOAD_OVERRIDE}], context[${CONTEXT}], scanner[${SCANNER}] and scb_engine_url[${SCB_URL}]..."
else
	info "Using values target[${TARGET}], context[${CONTEXT}], scanner[${SCANNER}] and scb_engine_url[${SCB_URL}]..."
fi

# Identify scanner process key, define target format
TARGET_FORMAT=""
case "${SCANNER}" in
	"arachni")
		TARGET_FORMAT="uri"
	;;
	"nmap-nikto")
		TARGET_FORMAT="uri"
	;;
	"nikto")
		TARGET_FORMAT="uri"
	;;
 	"nmap")
		TARGET_FORMAT="host"
	;;
	"sslyze")
		TARGET_FORMAT="host"
	;;
	"zap")
		TARGET_FORMAT="uri"
	;;
esac

# Post-process paramaters
CURL_AUTH_ARG=""
if [ -n "${AUTH}" ]; then
	CURL_AUTH_ARG="-u ${AUTH}"
fi

# Keep track of any errors
NUM_ERRORS=0

if [ ! -n "${PAYLOAD_OVERRIDE}" ]; then 
	# Verify target format
	if [ "${TARGET_FORMAT}" = "uri" ]; then
		if [[ ! "${TARGET}" =~ http?(s)://* ]]; then
			error "Invalid URI to scan: '${TARGET}'! Expected: http(s)://..."
			NUM_ERRORS=$((NUM_ERRORS + 1))
		else
			response=`curl -v --connect-timeout 5 --silent --stderr - ${TARGET} | grep Connected`
			if [ -z "${response}" ]; then
				error "Invalid URI to scan! Cannot connect to site '${TARGET}' with 'curl -v --silent --stderr - ${TARGET}'."
				NUM_ERRORS=$((NUM_ERRORS + 1))
			fi
		fi
	fi

	# Verify that the scanner template is present
	TEMPLATE_FILE="${SCANNER}.template.json"
	if [ ! -f "${TEMPLATE_FILE}" ]; then
		error "File '${TEMPLATE_FILE}' for scan type '${SCANNER}' could not be found!'"
		NUM_ERRORS=$((NUM_ERRORS + 1))
	fi
fi

# Verify context variable
if [ -n "${CONTEXT}" ] && [ ${CONTEXT} -lt 3 ]; then 
	error "Invalid context name: '${CONTEXT}'. Expected minimum of three characters."
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

# Verify waiting time
if [ $(is_number "$WAIT_TIME") != true ]; then
	error "Waiting time (-w) must be an integer (was '$WAIT_TIME')."
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

# Verify max. number of iterations
if [ $(is_number "$MAX_ITER") != true ]; then
	error "Number of queries (-i) must be an integer (was '$MAX_ITER')."
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

# Verify that SCB is reachable
response=`curl --connect-timeout 5 --silent --stderr --insecure ${CURL_AUTH_ARG} ${SCB_URL}/processes/`
if [[ ! ${response} == *"key"* ]]; then
	error "Failed to contact engine service! Used URI: '${SCB_URL}/processes/" "${response}"
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

# Abort if any error occurred
if [ ${NUM_ERRORS} -gt 0 ]; then
	fatal "Aborting due to $NUM_ERRORS previous errors!"
	exit 2
fi

# extract port from protocol
PORT=80
if [[ "${TARGET}" == "https"* ]]; then
	PORT=443
fi

# extract explicit port
HOST_PORT=`echo ${TARGET} | sed 's!^https\?://!!g' | sed 's!/.*$!!g'` # hostname including user-provided port
USER_PORT=`echo ${HOST_PORT} | sed 's!^.*:!!g'`
if [ -n "${USER_PORT}" ] && [ $(is_number "${USER_PORT}") == true ]; then
	PORT=${USER_PORT}
fi
info "Determined target port number '${PORT}'."

if [ ! -n "${PAYLOAD_OVERRIDE}" ]; then 
	# Create JSON payload from template. Replace variables %CONTEXT%, %TARGET%, %HOST_PORT%, and %HOST%
	HOST=`echo ${HOST_PORT} | sed 's!:.*$!!g'` # hostname only
	info "Using values target[${TARGET}], host_port[${HOST_PORT}], port[${PORT}], host[${HOST}], template_file[${TEMPLATE_FILE}], and payload_file[${PAYLOAD_FILE}]."
	sed -E "s/%CONTEXT%/${CONTEXT}/g;s/%TARGET_NAME%/${TARGET_NAME}/g;s!%TARGET%!${TARGET}!g;s!%HOST_PORT%!${HOST_PORT}!g;s!%HOST%!${HOST}!g;s!%PORT%!${PORT}!g" "${TEMPLATE_FILE}" >"${PAYLOAD_FILE}"
	response=`sed "s/%(.+?)%/<unresolved>\n/g" "${PAYLOAD_FILE}" | grep -c "<unresolved>"`
	if [ ! -f "${PAYLOAD_FILE}" ] || [ ${response} -gt 0 ]; then
		fatal "Failed to replace all variables in template '${TEMPLATE_FILE}'! Please check file '${PAYLOAD_FILE}'." "${response}"
		exit 3
	fi
	info "All variables replaced successfully"
else
	info "Overriding payload file with user specified payload."
	cp "${PAYLOAD_OVERRIDE}" "${PAYLOAD_FILE}"
fi

# Create job
info "Successfully created JSON payload '${PAYLOAD_FILE}'."
command="curl -H 'Content-Type: application/json' ${CURL_AUTH_ARG} -X PUT -d @${PAYLOAD_FILE} -s ${SCB_URL}/securityTests"
info "Using command: \"${command}\""
response=`eval ${command}`

ID_PROCESS=`echo ${response} | xargs | sed 's/\[//' | sed 's/\]//'`
if [ ${#ID_PROCESS} -lt 10 ]; then
	fatal "Failed to identify process ID! Please check '${LOG_FILE}' (got '${response}')"
	exit 4
fi

info "Started securityTest '${ID_PROCESS}'. Polling for completed securityTest in ${WAIT_TIME} second intervals."

# Fetch findings
command="curl -s -o /dev/null -w "%{http_code}" ${CURL_AUTH_ARG} ${SCB_URL}/securityTests/${ID_PROCESS}"

info "Using command \"${command}\". Waiting for initial results..."
sleep "${WAIT_TIME}"
found=false
OLD_NUM_RESULTS=0
NUM_TRIES=1
while true;
do
  responseCode=`${command}`
  if [ "${responseCode}" = "200" ]; then
    info "Found results. Scan completed.";
	found=true
	break
  elif [ "${responseCode}" = "206" ]; then
    info "Nothing yet."
  else
    error "Got an unexpected response code: ${responseCode}";
	break
  fi

  if [ "${NUM_TRIES}" == "${MAX_ITER}" ]; then
    break
  fi
  NUM_TRIES=$((NUM_TRIES + 1))
  sleep "${WAIT_TIME}"
done

if [ "${found}" != true ]; then
	fatal "No findings identified after ${NUM_TRIES} iterations."
	exit 5
fi

response=`curl -s ${CURL_AUTH_ARG} ${SCB_URL}/securityTests/${ID_PROCESS}`

NUM_RESULTS=`echo "${response}" | grep 'false_positive":false' | wc -l | xargs`

info "SecurityTest identified ${NUM_RESULTS} findings."

# Persist securityTest
echo "${response}" >"${RESULT_FILE}"
info "secureCodeBox run completed successfully. Findings written to files '${RESULT_FILE}'."
exit 0
