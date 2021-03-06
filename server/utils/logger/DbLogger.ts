import LogRepository from "../../repositories/LogRepository";
import { Log } from "../../types/BasicLogging";
import LoggerBase from "./LoggerBase";
import LoggerEventEmit from "./LoggerEventEmit";

class DbLogger extends LoggerBase {
  protected extractLog(expression: any[]): Log {
    return expression.find((obj: any) => {
      return obj instanceof Log;
    });
  }

  public async log(
    string: TemplateStringsArray,
    expression: any[],
    level: string,
  ): Promise<void> {
    const result = this.extractLog(expression);
    if (!result) {
      return;
    }
    result.level = level;
    result.message = string.toString();

    const log = await LogRepository.create(result);
    LoggerEventEmit.getInstance().emitter().emit("stream", log);
  }
}

export default DbLogger;
