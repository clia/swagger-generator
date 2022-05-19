import { CurlRequestParser } from '../utils/curlRequestParser';
import { HttpRequestParser } from '../utils/httpRequestParser';
import { ICliaSwaggerSettings, SystemSettings } from './configurationSettings';
import { RequestParser } from './requestParser';

export class RequestParserFactory {

    private static readonly curlRegex: RegExp = /^\s*curl/i;

    public static createRequestParser(rawRequest: string): RequestParser;
    public static createRequestParser(rawRequest: string, settings: ICliaSwaggerSettings): RequestParser;
    public static createRequestParser(rawHttpRequest: string, settings?: ICliaSwaggerSettings): RequestParser {
        settings = settings || SystemSettings.Instance;
        if (RequestParserFactory.curlRegex.test(rawHttpRequest)) {
            return new CurlRequestParser(rawHttpRequest, settings);
        } else {
            return new HttpRequestParser(rawHttpRequest, settings);
        }
    }
}