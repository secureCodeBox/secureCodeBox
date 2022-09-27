package utils

import (
	"errors"
	"os"
	"time"
)

type ControllerType int

const (
	ScanController ControllerType = iota
	HookController
	ParserController
)

func (e ControllerType) String() string {
	switch e {
	case ScanController:
		return "SCAN"
	case HookController:
		return "HOOK"
	case ParserController:
		return "PARSER"
	default:
		return "WRONG_ENUM_NUMBER"
	}
}

func GetUrlExpirationDuration(controller ControllerType) (time.Duration, error) {
	urlExpirationTimeString, envOk := os.LookupEnv("URL_EXPIRATION_" + controller.String())
	urlExpirationDuration, durationOk := time.ParseDuration(urlExpirationTimeString)

	if !(envOk && durationOk == nil) {
		return time.Hour, errors.New("Cannot parse env variable: URL_EXPIRATION_" + controller.String())
	}
	return urlExpirationDuration, nil
}
