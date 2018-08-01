#!/bin/bash

echo '                                                                        '
echo '  ____                                        ____                      '
echo ' /\  _`\                                     /\  _`\                    '
echo ' \ \,\L\_\     __    ___   __  __  _ __    __\ \ \L\ \    ___   __  _   '
echo '  \/_\__ \   / __`\ / ___\/\ \/\ \/\` __\/ __`\ \  _ <   / __ \/\ \/ \  '
echo '    /\ \L\ \/\  __//\ \__/\ \ \_\ \ \ \//\  __/\ \ \L\ \/\ \L\ \/>  </  '
echo '    \ `\____\ \____\ \____\\ \____/\ \_\\ \____\\ \____/\ \____//\_/\_\ '
echo '     \/_____/\/____/\/____/ \/___/  \/_/ \/____/ \/___/  \/___/ \//\/_/ '
echo '                                                                        '

echo -e ' SCB scan process runner v0.1\n'

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

TENANT="" # tenant
AUTH="" # HTTP Basic auth key
SCB_PATH="/box" # SCB API access path
SCB_URL="http://localhost:8080${SCB_PATH}" # SCB API access URL
ES_URL="http://localhost:9200" # Elasticsearch API access URL
DEFAULT_MAX_ITER=30
MAX_ITER="${DEFAULT_MAX_ITER}" # maximum number of iterations
DEFAULT_WAIT_TIME=60
WAIT_TIME="${DEFAULT_WAIT_TIME}" # waiting time between iterations
SHOW_HELP=false # display help screen?
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
		-t|--tenant)
		TENANT="$2"
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
		ES_URL="$3"
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
	echo "    scanner               - scanner type, one of arachni|nmap-nikto|nikto|nmap|nmap-raw|sslyze|zap"
	echo "    target                - target URL that shall be scanned, e.g. http://some.target:8080/shop"
	echo ""
	echo "  Options:"
	echo "    -a|--auth key"
	echo "        key               - HTTP Basic authentication key for SCB engine"
	echo "    -b|--backend scb_engine_url elasticsearch_url"
	echo "        scb_engine_url    - SecureCodeBox Engine URL, e.g. http://some_scb_engine:8080"
	echo "        elasticsearch_url - Elasticsearch URL, e.g. http://some_scb_elasticsearch:9200"
	echo "    -i|--max-iter num_iter"
	echo "        num_iter          - Maximum number of queries to perform (default: ${DEFAULT_MAX_ITER})"
	echo "    -t|--tenant tenant"
	echo "        tenant            - Tenant id to use"
	echo "    -w|--wait time"
	echo "        time              - Time to wait between queries (in seconds) (default: ${DEFAULT_WAIT_TIME})"
	echo "    -p|--payload path"
	echo "        path              - Path to a json file containing the payload used to create the scan job. This overrides the target configuration."
	echo ""
	echo "  Default 'scb_engine_url' (if none given): 'http://localhost:8080'"
	echo "  Default 'elasticsearch_url' (if none given): 'http://localhost:9200'"
	echo "  Note: If you do not use the default SCB instance it is necessary to provide both"
	echo "  'scb_engine_url' and 'elasticsearch_url' parameters WITH ports!"
	echo ""
	echo "Examples:"
	echo "  Perform a ZAP scan:"
	echo "    ./run_scanner.sh http://some.system/somepath mytenant zap"
	echo "  Perform an NMAP scan:"
	echo "    ./run_scanner.sh some.system mytenant nmap"
	echo "  Perform an SSLyze scan using authentication:"
	echo "    ./run_scanner.sh --auth a2VybWl0OmE= some.system mytenant sslyze"
	echo "  Perform a Nikto scan using a different backend:"
	echo "    ./run_scanner.sh --backend http://some_scb_engine:8080 http://some_scb_elasticsearch:9200 some.system mytenant nikto"
	
	exit 1
fi

# backup last logfile
LOG_FILE="job_${TENANT}_${SCANNER}.log"
if [ -f "${LOG_FILE}" ]; then
	info "Writing backup of last job's log to '${LOG_FILE}.last'"
	mv "${LOG_FILE}" "${LOG_FILE}.last"
fi
echo >"${LOG_FILE}"

# backup last result file
RESULT_FILE="job_${TENANT}_${SCANNER}_result.json"
if [ -f "${RESULT_FILE}" ]; then
	info "Writing backup of last job's result to '${RESULT_FILE}.last'"
	mv "${RESULT_FILE}" "${RESULT_FILE}.last"
fi

# backup last readable result file
READABLE_RESULT_FILE="job_${TENANT}_${SCANNER}_result.readable"
if [ -f "${READABLE_RESULT_FILE}" ]; then
	info "Writing backup of last job's readable result to '${READABLE_RESULT_FILE}.last'"
	mv "${READABLE_RESULT_FILE}" "${READABLE_RESULT_FILE}.last"
fi

# backup last payload
PAYLOAD_FILE="job_${TENANT}_${SCANNER}_payload.json"
if [ -f "${PAYLOAD_FILE}" ]; then
	info "Writing backup of last job's payload to '${PAYLOAD_FILE}.last'"
	mv "${PAYLOAD_FILE}" "${PAYLOAD_FILE}.last"
fi

if [ -n "${PAYLOAD_OVERRIDE}" ]; then 
	info "Using payload from file[${PAYLOAD_OVERRIDE}], tenant[${TENANT}], scanner[${SCANNER}], scb_engine_url[${SCB_URL}] and elasticsearch_url[${ES_URL}]..."
else
	info "Using values target[${TARGET}], tenant[${TENANT}], scanner[${SCANNER}], scb_engine_url[${SCB_URL}] and elasticsearch_url[${ES_URL}]..."
fi

# Identify scanner process key, define target format
PROCESS_KEY=""
TARGET_FORMAT=""
case "${SCANNER}" in
	"arachni")
		PROCESS_KEY="arachni_webapplicationscan"
		TARGET_FORMAT="uri"
	;;
	"nmap-nikto")
		PROCESS_KEY="combined-nmap-nikto-process"
		TARGET_FORMAT="uri"
	;;
	"nikto")
		PROCESS_KEY="nikto-process"
		TARGET_FORMAT="uri"
	;;
 	"nmap")
		PROCESS_KEY="nmap-process"
		TARGET_FORMAT="host"
	;;
	"nmap-raw")
		PROCESS_KEY="nmap-process-raw"
		TARGET_FORMAT="host"
	;;
	"sslyze")
		PROCESS_KEY="sslyze-process"
		TARGET_FORMAT="host"
	;;
	"zap")
		PROCESS_KEY="zap-process"
		TARGET_FORMAT="uri"
	;;
esac

# Keep track of any errors
NUM_ERRORS=0

# Check if we could identify a scanner process key
if [ -z "${PROCESS_KEY}" ]; then
	error "Invalid scan type '${SCANNER}'."
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

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

# Verify tenant id
if [ -n "${TENANT}" ] && [ ${#TENANT} -lt 3 ]; then 
	error "Invalid tenant name: '${TENANT}'. Expected minimum of three characters."
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
response=`curl --connect-timeout 5 --silent --stderr --insecure ${SCB_URL}/processes/`
if [[ ! ${response} == *"key"* ]]; then
	error "Failed to contact engine service! Used URI: '${SCB_URL}/processes/" "${response}"
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

# Verify that ES is reachable
response=`curl --connect-timeout 5 --silent --stderr --insecure ${ES_URL}/`
if [[ ! ${response} == *cluster_uuid* ]]; then
	error "Failed to contact elastic search! Used URI: '${ES_URL}/'" ${response}
	NUM_ERRORS=$((NUM_ERRORS + 1))
fi

# Abort if any error occurred
if [ ${NUM_ERRORS} -gt 0 ]; then
	fatal "Aborting due to $NUM_ERRORS previous errors!"
	exit 2
fi

# Post-process paramaters
CURL_AUTH_ARG=""
if [ -n "${AUTH}" ]; then
	CURL_AUTH_ARG="-H 'Authorization: Basic ${AUTH}'"
fi

CAMUNDA_TENANT_PATH=""
if [ -n "${TENANT}" ]; then
	CAMUNDA_TENANT_PATH="/tenant-id/${TENANT}"
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
	# Create JSON payload from template. Replace variables %TENANT%, %TARGET%, %HOST_PORT%, and %HOST%
	HOST=`echo ${HOST_PORT} | sed 's!:.*$!!g'` # hostname only
	info "Using values process_key[${PROCESS_KEY}], target[${TARGET}], host_port[${HOST_PORT}], port[${PORT}], host[${HOST}], template_file[${TEMPLATE_FILE}], and payload_file[${PAYLOAD_FILE}]."
	sed -E "s/%TENANT%/${TENANT}/g;s!%TARGET%!${TARGET}!g;s!%HOST_PORT%!${HOST_PORT}!g;s!%HOST%!${HOST}!g;s!%PORT%!${PORT}!g" "${TEMPLATE_FILE}" >"${PAYLOAD_FILE}"
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
command="curl -H 'Content-Type: application/json' ${CURL_AUTH_ARG} -X PUT -d @${PAYLOAD_FILE} -s ${SCB_URL}/processes/${PROCESS_KEY}"
if [ -f "${TENANT}_createid.override" ]; then
	info "File '${TENANT}_createid.override' was found. Using its content instead of result of command '${command}'."
	response=`cat "${TENANT}_createid.override"`
else
	info "Using command: \"${command}\""
	response=`eval ${command}`
fi

ID_PROCESS=`echo ${response} | sed -r "s/\"//g"`
if [ ${#ID_PROCESS} -lt 10 ]; then
	fatal "Failed to identify process ID! Please check '${LOG_FILE}' (got '${response}')"
	exit 4
fi

# Fetch findings
info "Started scan process '${ID_PROCESS}'. Querying for scan summary in ${WAIT_TIME} second intervals."
DATE=`date +%Y-%m-%d`
command="curl -H 'Content-Type: application/json' -X POST -s '${ES_URL}/securecodebox_$DATE/_doc/_search?pretty=true' -d '{ \
	\"size\" : 10000, \
    \"query\" : { \
    	\"bool\": { \
    		\"must\": [ \
		    	{ \
		    		\"match_phrase\": { \
		            	\"execution.id.keyword\": { \
		            		\"query\": \"${ID_PROCESS}\" \
		        		} \
		        	} \
		    	}, \
		    	{ \
		    		\"match_phrase\": { \
		            	\"type.keyword\": { \
		            		\"query\": \"finding_entry\" \
		        		} \
		        	} \
		    	} \
		    ] \
    	} \
    } \
} \
'"
info "Using command \"${command}\". Waiting for initial results..."
sleep "${WAIT_TIME}"
found=false
OLD_NUM_RESULTS=0
NUM_TRIES=1
while true;
do
  response=`eval ${command}`
  NUM_RESULTS=`echo "${response}" | sed "s/,/\n/g;s/\"//g" | grep "report_id" | wc -l`
  if [ "$NUM_RESULTS" -gt 0 ]; then
 	found=true
 	info "Iteration ${NUM_TRIES}: ${NUM_RESULTS} findings identified."
 	if [ "${NUM_RESULTS}" == "${OLD_NUM_RESULTS}" ]; then
		break
	fi
	OLD_NUM_RESULTS=$NUM_RESULTS
	info "Going to perform one more iteration to confirm total number of findings."
   else
	info "Iteration ${NUM_TRIES}: No findings yet."
	if [ "${NUM_TRIES}" == "${MAX_ITER}" ]; then
		break
	fi
  fi
  NUM_TRIES=$((NUM_TRIES + 1))
  sleep "${WAIT_TIME}"
done

if [ "${found}" != true ]; then
	fatal "No findings identified after ${NUM_TRIES} iterations."
	exit 5
fi

# Query findings
NUM_TRIES=$((NUM_TRIES - 1))
info "Findings identified in iteration ${NUM_TRIES}."
echo "${response}" >"${RESULT_FILE}"
response_cleaned=`echo "${response}" | sed 's/,\$//g' | sed 's/\[//g' | sed 's/\]//g' | sed 's/{//g' | sed 's/}//g' | sed 's/\"//g' | sed '/^[[:space:]]*$/d'`
echo "${response_cleaned}" >"${READABLE_RESULT_FILE}"
info "SecureCodeBox run completed successfully. Findings written to files '${RESULT_FILE}' and '${READABLE_RESULT_FILE}'."
exit 0
