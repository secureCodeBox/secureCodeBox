import { Finding } from "./model/Finding"

export interface Notifier {
  /**
   * Sends a Notification Message to the desired End-Point (e.g. Slack or MS Teams) 
   * @param findings Findings that should be included in the Message
   */
  sendMessage(findings: Finding[]): Promise<void>

  /**
   * Initializes the Notifier with the given template
   */
  initCustomTemplate(customTemplate: string): Promise<void>

  /**
   * Loads Template with given name from default templates for this Notifier
   */
  initTemplate(templateName: string): Promise<void>
}
