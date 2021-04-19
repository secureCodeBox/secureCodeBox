import { NotifierType } from "../NotifierType"

export interface NotificationChannel {
  name: string;
  type: NotifierType;
  template: string;
  rules: any;
  endPoint: string;
}
