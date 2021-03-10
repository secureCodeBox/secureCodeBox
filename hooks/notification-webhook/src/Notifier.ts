import { Finding } from "./model/Finding"

export interface Notifier {
  sendNotification(findings: Finding[]): void
}
