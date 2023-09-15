// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"context"
	"fmt"
	"time"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func RetriggerScheduledScan(ctx context.Context, statusWriter client.StatusWriter, scheduledScan executionv1.ScheduledScan) error {
	// create a new faked lastScheduledTime in the past to force the scheduledScan to be repeated immediately
	// past timestamp is calculated by subtracting the repeat Interval and 24 hours to ensure that it will work even when the auto-discovery and scheduledScan controller have a clock skew
	fakedLastSchedule := metav1.Time{Time: time.Now().Add(-scheduledScan.Spec.Interval.Duration - 24*time.Hour)}
	scheduledScan.Status.LastScheduleTime = &fakedLastSchedule
	err := statusWriter.Update(ctx, &scheduledScan)
	if err != nil {
		return fmt.Errorf("Failed to restart ScheduledScan: %w", err)
	}

	return nil
}
