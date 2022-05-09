// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType"
import { AbstractWebHookNotifier } from "./AbstractWebHookNotifier"
import { Finding } from "../model/Finding"
import { matches } from "../hook";
import axios from 'axios';
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";

export class TrelloNotifier extends AbstractWebHookNotifier {

  public static readonly TRELLO_CARDS_ENDPOINT = 'TRELLO_CARDS_ENDPOINT';
  public static readonly TRELLO_KEY = 'TRELLO_KEY';
  public static readonly TRELLO_TOKEN = 'TRELLO_TOKEN';
  public static readonly TRELLO_LIST = 'TRELLO_LIST';
  public static readonly TRELLO_LABELS = 'TRELLO_LABELS';
  public static readonly TRELLO_POS = 'TRELLO_POS';
  public static readonly TRELLO_TITLE_PREFIX = 'TRELLO_TITLE_PREFIX';

  protected type: NotifierType = NotifierType.TRELLO

  constructor(channel: NotificationChannel, scan: Scan, findings: Finding[], args: Object) {
    super(channel, scan, findings, args);
  }

  /**
   * Trello cards API has a default endpoint https://api.trello.com/1/cards
   * So if the TRELLO_CARDS_ENDPOINT env is not explicitly defined then default to that URL
   */
  public resolveEndPoint(): string {
    if(TrelloNotifier.TRELLO_CARDS_ENDPOINT in process.env) { 
      return super.resolveEndPoint(); 
    }
    return "https://api.trello.com/1/cards"
  }

  // The Trello hook will create a card for each finding
  public async sendMessage(): Promise<void> {
    for ( let idx in this.findings ) {
      var jsonData = {
          "key": this.getTrelloKey(),
          "token": this.getTrelloToken(),
          "idList": this.getTrelloList(),
          "name": this.getCardName(this.findings[idx]),
          "desc": this.getCardDescription(this.findings[idx]),
          "pos": this.getTrelloPos()
      }

      // Add the labels only if defined    
      if(this.getTrelloLabels().length > 0)
        jsonData["idLabels"] = this.getTrelloLabels();

      await this.sendJSONPostRequest(jsonData);
    }
  }

  protected async sendJSONPostRequest( jsonData ) {
    try {
      await axios.post(this.resolveEndPoint(), jsonData)
    } catch (e) {
      console.log(`There was an Error sending the Message for the "${this.type}": "${this.channel.name}"`);
      console.log(e);
    }
  }

  private getTrelloKey(): string {
    return process.env[TrelloNotifier.TRELLO_KEY];
  }

  private getTrelloToken(): string {
    return process.env[TrelloNotifier.TRELLO_TOKEN];
  }

  private getTrelloList(): string {
    return process.env[TrelloNotifier.TRELLO_LIST];
  }

  // If labels env not defined return empty string
  private getTrelloLabels(): string {
    if(TrelloNotifier.TRELLO_LABELS in process.env) { 
      return process.env[TrelloNotifier.TRELLO_LABELS];
    }
    return ""
  }

  // If card pos env not defined return top
  private getTrelloPos(): string {
    if(TrelloNotifier.TRELLO_POS in process.env) { 
      return process.env[TrelloNotifier.TRELLO_POS];
    }
    return "top"
  }

  // Any user defined prefix to add to the card title
  private getTrelloTitlePrefix(): string {
    if(TrelloNotifier.TRELLO_TITLE_PREFIX in process.env) { 
      return process.env[TrelloNotifier.TRELLO_TITLE_PREFIX];
    }
    return ""
  }

  // Constructs the card name from the finding
  private getCardName(finding: Finding): string {
    return this.getTrelloTitlePrefix() + finding.name + "(" + finding.severity + ")";
  }

  private getCardDescription(finding: Finding): string {
    let res = "Location: " + finding.location + "\n" +
          "Description: " + finding.description + "\n";

    // Add Zap specific information if available
    if(finding.attributes.size > 0) {
      if("zap_solution" in finding.attributes)
        res += "Solution: " + finding.attributes["zap_solution"] + "\n";
      if("zap_reference" in finding.attributes)
        res += "Reference: " + finding.attributes["zap_reference"] + "\n";
    }

    return res;
  }


}
