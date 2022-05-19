'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, languages, Range, TextDocument, Uri, window, workspace } from 'vscode';
import { CodeSnippetController } from './controllers/codeSnippetController';
import { EnvironmentController } from './controllers/environmentController';
import { HistoryController } from './controllers/historyController';
import { RequestController } from './controllers/requestController';
import { CustomVariableDiagnosticsProvider } from "./providers/customVariableDiagnosticsProvider";
import { RequestBodyDocumentLinkProvider } from './providers/documentLinkProvider';
import { EnvironmentOrFileVariableHoverProvider } from './providers/environmentOrFileVariableHoverProvider';
import { FileVariableDefinitionProvider } from './providers/fileVariableDefinitionProvider';
import { FileVariableReferenceProvider } from './providers/fileVariableReferenceProvider';
import { FileVariableReferencesCodeLensProvider } from './providers/fileVariableReferencesCodeLensProvider';
import { HttpCodeLensProvider } from './providers/httpCodeLensProvider';
import { HttpCompletionItemProvider } from './providers/httpCompletionItemProvider';
import { HttpDocumentSymbolProvider } from './providers/httpDocumentSymbolProvider';
import { MarkdownCodeLensProvider } from './providers/markdownCodeLensProvider';
import { RequestVariableCompletionItemProvider } from "./providers/requestVariableCompletionItemProvider";
import { RequestVariableDefinitionProvider } from './providers/requestVariableDefinitionProvider';
import { RequestVariableHoverProvider } from './providers/requestVariableHoverProvider';
import { AadTokenCache } from './utils/aadTokenCache';
import { ConfigurationDependentRegistration } from './utils/dependentRegistration';
import { UserDataManager } from './utils/userDataManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
console.log("init");
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

    const documentSelector2 = [
        { language: 'http', scheme: '*' }
    ];

    const mdDocumentSelector = [
        { language: 'markdown', scheme: '*' }
    ];

    context.subscriptions.push(languages.registerCompletionItemProvider(documentSelector2, new HttpCompletionItemProvider()));
    context.subscriptions.push(languages.registerCompletionItemProvider(documentSelector2, new RequestVariableCompletionItemProvider(), '.'));
    context.subscriptions.push(languages.registerHoverProvider(documentSelector2, new EnvironmentOrFileVariableHoverProvider()));
    context.subscriptions.push(languages.registerHoverProvider(documentSelector2, new RequestVariableHoverProvider()));

    context.subscriptions.push(
        new ConfigurationDependentRegistration(
            () => languages.registerCodeLensProvider(documentSelector, new HttpCodeLensProvider()),
            s => s.enableSendRequestCodeLens));

    context.subscriptions.push(
        new ConfigurationDependentRegistration(
            () => languages.registerCodeLensProvider(documentSelector2, new FileVariableReferencesCodeLensProvider()),
            s => s.enableCustomVariableReferencesCodeLens));

    context.subscriptions.push(
        new ConfigurationDependentRegistration(
            () => languages.registerCodeLensProvider(mdDocumentSelector, new MarkdownCodeLensProvider()),
            s => s.enableSendRequestCodeLens));

    context.subscriptions.push(languages.registerDocumentLinkProvider(documentSelector2, new RequestBodyDocumentLinkProvider()));
    context.subscriptions.push(languages.registerDefinitionProvider(documentSelector2, new FileVariableDefinitionProvider()));
    context.subscriptions.push(languages.registerDefinitionProvider(documentSelector2, new RequestVariableDefinitionProvider()));
    context.subscriptions.push(languages.registerReferenceProvider(documentSelector2, new FileVariableReferenceProvider()));
    context.subscriptions.push(languages.registerDocumentSymbolProvider(documentSelector2, new HttpDocumentSymbolProvider()));

    const diagnosticsProvider = new CustomVariableDiagnosticsProvider();
    context.subscriptions.push(diagnosticsProvider);
console.log("finished");
}

// this method is called when your extension is deactivated
export function deactivate() {
}
