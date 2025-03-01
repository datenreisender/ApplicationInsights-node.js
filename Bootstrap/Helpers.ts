import { DiagnosticLog, DiagnosticMessageId } from "./DataModel";
import { DiagnosticLogger } from "./DiagnosticLogger";
import { isWindows, isLinux } from "../Library/PrefixHelper";

export function sdkAlreadyExists(_logger: DiagnosticLogger): boolean {
    try {
        // appInstance should either resolve to user SDK or crash. If it resolves to attach SDK, user probably modified their NODE_PATH
        let appInstance: string;
        try {
            // Node 8.9+ Windows
            if (isWindows()) {
                appInstance = (require.resolve as any)("applicationinsights", { paths: [process.cwd()] });
            }
            // Node 8.9+ Linux
            else if (isLinux()) {
                appInstance = `${process.cwd()}${(require.resolve as any)("applicationinsights", { paths: [process.cwd()] })}`;
            }
        } catch (e) {
            // Node <8.9
            appInstance = require.resolve(process.cwd() + "/node_modules/applicationinsights");
        }
        // If loaded instance is in Azure machine home path do not attach the SDK, this means customer already instrumented their app
        if (appInstance.indexOf("home") > -1) {
            const diagnosticLog: DiagnosticLog = {
                message: "Application Insights SDK already exists. Module is already installed in this application; not re-attaching. Installed SDK location: " + appInstance,
                properties: {
                    "msgId": DiagnosticMessageId.sdkExists
                }
            };
            _logger.logError(diagnosticLog);
            return true;
        }
        else {
            // ApplicationInsights could be loaded outside of customer application, attach in this case
            return false;
        }
    } catch (e) {
        // crashed while trying to resolve "applicationinsights", so SDK does not exist. Attach appinsights
        return false;
    }
}