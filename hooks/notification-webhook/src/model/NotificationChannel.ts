import { NotifierType } from "../NotifierType"

export class NotificationChannel {
  public name: string;
  public type: NotifierType;
  public templateName: string;
  public rules: any;
  public endPoint: string;
}
