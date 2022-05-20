'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, languages, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { CodeSnippetController } from './controllers/codeSnippetController';
import { EnvironmentController } from './controllers/environmentController';
import { HistoryController } from './controllers/historyController';
import { RequestController } from './controllers/requestController';
import { CustomVariableDiagnosticsProvider } from "./providers/customVariableDiagnosticsProvider";
import { HttpCodeLensProvider } from './providers/httpCodeLensProvider';
import { AadTokenCache } from './utils/aadTokenCache';
import { ConfigurationDependentRegistration } from './utils/dependentRegistration';
import { UserDataManager } from './utils/userDataManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
    await UserDataManager.initialize();

    const requestController = new RequestController(context);
    const historyController = new HistoryController();
    const codeSnippetController = new CodeSnippetController(context);
    const environmentController = await EnvironmentController.create();
    context.subscriptions.push(requestController);
    context.subscriptions.push(historyController);
    context.subscriptions.push(codeSnippetController);
    context.subscriptions.push(environmentController);
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.request', ((document: TextDocument, range: Range) => requestController.run(range))));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.rerun-last-request', () => requestController.rerun()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.cancel-request', () => requestController.cancel()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.history', () => historyController.save()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.clear-history', () => historyController.clear()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.generate-codesnippet', () => codeSnippetController.run()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.copy-request-as-curl', () => codeSnippetController.copyAsCurl()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.switch-environment', () => environmentController.switchEnvironment()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator.clear-aad-token-cache', () => AadTokenCache.clear()));
    context.subscriptions.push(commands.registerCommand('clia-swagger-generator._openDocumentLink', args => {
        workspace.openTextDocument(Uri.parse(args.path)).then(window.showTextDocument, error => {
            window.showErrorMessage(error.message);
        });
    }));

    const documentSelector = [
        { language: 'rust', scheme: '*' }
    ];

    context.subscriptions.push(
        new ConfigurationDependentRegistration(
            () => languages.registerCodeLensProvider(documentSelector, new HttpCodeLensProvider()),
            s => s.enableSendRequestCodeLens));

    const diagnosticsProvider = new CustomVariableDiagnosticsProvider();
    context.subscriptions.push(diagnosticsProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
