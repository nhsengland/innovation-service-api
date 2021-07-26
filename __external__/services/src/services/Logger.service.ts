import { getInstance, start } from "../../../../utils/logging/insights";
import { Severity } from "../../../../utils/types";
export class LoggerService {
  private readonly insights;

  constructor() {
    start();
    this.insights = getInstance();
  }

  error(message: string, err: any): void {
    this.insights.defaultClient.trackTrace({
      message,
      severity: Severity.Error,
      properties: {
        error: err,
      },
    });
  }

  log(
    message: string,
    severity: Severity,
    props?: { [key: string]: any }
  ): void {
    this.insights.defaultClient.trackTrace({
      message,
      severity,
      properties: props,
    });
  }
}
