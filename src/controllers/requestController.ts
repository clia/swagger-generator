import { ExtensionContext, Range, TextDocument, ViewColumn, window } from 'vscode';
import Logger from '../logger';
import { ICliaSwaggerSettings, RequestSettings, RestClientSettings } from '../models/configurationSettings';
import { HttpRequest } from '../models/httpRequest';
import { trace } from "../utils/decorator";
import { RequestState, RequestStatusEntry } from '../utils/requestStatusBarEntry';
import { getCurrentTextDocument } from '../utils/workspaceUtility';
// import { HttpResponseWebview } from '../views/httpResponseWebview';
import { SwaggerWebview } from '../views/swaggerWebview';
import { SwaggerGenerator } from '../swagger/generator';
import { RequestMetadata } from '../models/requestMetadata';

export class RequestController {
    private _requestStatusEntry: RequestStatusEntry;
    // private _httpClient: HttpClient;
    private _webview: SwaggerWebview;
    private _lastRequestSettingTuple: [HttpRequest, ICliaSwaggerSettings];
    private _lastPendingRequest?: HttpRequest;

    public constructor(context: ExtensionContext) {
        this._requestStatusEntry = new RequestStatusEntry();
        // this._httpClient = new HttpClient();
        this._webview = new SwaggerWebview(context);
        this._webview.onDidCloseAllWebviewPanels(() => this._requestStatusEntry.update({ state: RequestState.Closed }));
    }

    @trace('Request')
    public async run(range: Range) {
        const editor = window.activeTextEditor;
        const document = getCurrentTextDocument();
        if (!editor || !document) {
            return;
        }

        const metadatas = new Map<RequestMetadata, string | undefined>();
        const requestSettings = new RequestSettings(metadatas);
        const settings: ICliaSwaggerSettings = new RestClientSettings(requestSettings);

        let generator = new SwaggerGenerator();
        const swagger = generator.createSwagger(document, range, settings);
        if (!swagger) {
            return;
        }

        // const selectedRequest = await Selector.getRequest(editor, range);
        // if (!selectedRequest) {
        //     return;
        // }

        // const { text, metadatas } = selectedRequest;
        // const name = metadatas.get(RequestMetadata.Name);

        // if (metadatas.has(RequestMetadata.Note)) {
        //     const note = name ? `Are you sure you want to send the request "${name}"?` : 'Are you sure you want to send this request?';
        //     const userConfirmed = await window.showWarningMessage(note, 'Yes', 'No');
        //     if (userConfirmed !== 'Yes') {
        //         return;
        //     }
        // }

        // const requestSettings = new RequestSettings(metadatas);
        // const settings: ICliaSwaggerSettings = new RestClientSettings(requestSettings);

        // // parse http request
        // const httpRequest = await RequestParserFactory.createRequestParser(text, settings).parseHttpRequest(name);

        await this.runCore(swagger, document);
    }

    @trace('Rerun Request')
    public async rerun() {
        if (!this._lastRequestSettingTuple) {
            return;
        }

        // const [request, settings] = this._lastRequestSettingTuple;

        // // TODO: recover from last request settings
        // await this.runCore(request, settings);
    }

    @trace('Cancel Request')
    public async cancel() {
        this._lastPendingRequest?.cancel();

        this._requestStatusEntry.update({ state: RequestState.Cancelled });
    }

    private async runCore(swagger: string, _document?: TextDocument) {
        // clear status bar
        this._requestStatusEntry.update({ state: RequestState.Pending });

        // // set last request and last pending request
        // this._lastPendingRequest = httpRequest;
        // this._lastRequestSettingTuple = [httpRequest, settings];

        // set http request
        try {
            // const response = await this._httpClient.send(httpRequest, settings);

            // // check cancel
            // if (httpRequest.isCancelled) {
            //     return;
            // }

            // this._requestStatusEntry.update({ state: RequestState.Received, response });

            // if (httpRequest.name && document) {
            //     RequestVariableCache.add(document, httpRequest.name, response);
            // }

            try {
                const activeColumn = window.activeTextEditor!.viewColumn;
                const previewColumn = ((activeColumn as number) + 1) as ViewColumn;
                // if (settings.previewResponseInUntitledDocument) {
                // this._textDocumentView.renderText(swagger, previewColumn);
                // } else if (previewColumn) {
                this._webview.render(swagger, previewColumn);
                // this._textDocumentView.renderText(swagger, previewColumn);
                // }
            } catch (reason) {
                Logger.error('Unable to preview response:', reason);
                window.showErrorMessage(reason);
            }

            // // persist to history json file
            // await UserDataManager.addToRequestHistory(HistoricalHttpRequest.convertFromHttpRequest(httpRequest));
        } catch (error) {
            // // check cancel
            // if (httpRequest.isCancelled) {
            //     return;
            // }

            if (error.code === 'ETIMEDOUT') {
                error.message = `Request timed out. Double-check your network connection and/or raise the timeout duration (currently set to ms) as needed: 'clia-swagger-generator.timeoutinmilliseconds'. Details: ${error}.`;
            } else if (error.code === 'ECONNREFUSED') {
                error.message = `The connection was rejected. Either the requested service isn’t running on the requested server/port, the proxy settings in vscode are misconfigured, or a firewall is blocking requests. Details: ${error}.`;
            } else if (error.code === 'ENETUNREACH') {
                error.message = `You don't seem to be connected to a network. Details: ${error}`;
            }
            this._requestStatusEntry.update({ state: RequestState.Error });
            Logger.error('Failed to generate swagger:', error);
            window.showErrorMessage(error.message);
        } finally {
            // if (this._lastPendingRequest === httpRequest) {
            //     this._lastPendingRequest = undefined;
            // }
        }
    }

    public dispose() {
        this._requestStatusEntry.dispose();
        this._webview.dispose();
    }

}