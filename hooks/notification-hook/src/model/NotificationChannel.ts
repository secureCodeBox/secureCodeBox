import { NotifierType } from "../NotifierType"

export interface NotificationChannel {
  name: string;
  type: NotifierType;
  templateName: string;
  rules: any;
  endPoint: string;
}
