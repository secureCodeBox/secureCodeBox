package controllers

import (
	"context"
	"fmt"
	"time"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// todo(@J12934) replace this function by referencing operator utils.RetriggerScheduledScan func once its merged on main branch
func restartScheduledScan(ctx context.Context, statusWriter client.StatusWriter, scheduledScan executionv1.ScheduledScan) error {
	// create a new faked lastScheduledTime in the past to force the scheduledScan to be repeated immediately
	// past timestamp is calculated by subtracting the repeat Interval and 24 hours to ensure that it will work even when the auto-discovery and scheduledScan controller have a clock skew
	fakedLastSchedule := metav1.Time{Time: time.Now().Add(-scheduledScan.Spec.Interval.Duration - 24*time.Hour)}
	scheduledScan.Status.LastScheduleTime = &fakedLastSchedule
	err := statusWriter.Update(ctx, &scheduledScan)
	if err != nil {
		return fmt.Errorf("failed to restart ScheduledScan: %w", err)
	}

	return nil
}
