import { Range, TextDocument } from 'vscode';
import * as Constants from '../common/constants';
import Logger from '../logger';
import { ICliaSwaggerSettings } from '../models/configurationSettings';

class ParamDef {
    name: string;
    type: string;
    required: boolean;
    desc: string;

    constructor(name: string, type: string, required: boolean, desc: string) {
        this.name = name;
        this.type = type;
        this.required = required;
        this.desc = desc;
    }

}  

export class SwaggerGenerator {

    public createSwagger(document: TextDocument, range: Range | null = null, settings: ICliaSwaggerSettings): string | null {

        if (!range) {
            return null;
        }

        const lines: string[] = document.getText().split(Constants.LineSplitterRegex);

        // Process web line
        const webLine = lines[range.start.line - 1];
        Logger.info("webLine: ", webLine);
        console.log("webLine: ", webLine);

        const wl = webLine;
        const method = wl.substring(wl.indexOf('::') + 2, wl.indexOf('('));
        console.log("method: ", method);
        const path = wl.substring(wl.indexOf('"') + 1, wl.lastIndexOf('"'));
        console.log("path: ", path);

        // Process fn def
        let fnDef: string = '';
        for (let i = range.start.line; i < lines.length; i++) {
            fnDef += lines[i];
            if (lines[i].indexOf('{') !== -1) {
                break;
            }
        }
        console.log("fnDef: ", fnDef);

        const fnName = fnDef.substring(fnDef.indexOf(' fn ') + 4, fnDef.indexOf('(')).trim();
        console.log("fnName: ", fnName);

        // Process param def
        const paramsDef = fnDef.substring(fnDef.indexOf('(') + 1, fnDef.indexOf(')'));
        console.log("paramsDef: ", paramsDef);

        const fnLine = lines[range.start.line];
        let params: string[] = [];
        if (fnLine.indexOf('}') !== -1) {
            // Params in the same line, split directly
            paramsDef.split(',').forEach((val) => params.push(val.trim()));
        } else {
            // Every param a line, may be complex, may contains ','
            for (let i = range.start.line + 1; i < lines.length; i++) {
                if (lines[i].indexOf('{') !== -1) {
                    break;
                }

                let def = lines[i].trim();
                if (def.endsWith(',')) {
                    def = def.substring(0, def.length - 1);
                }
                params.push(def);
            }
        }
        console.log("params: ", params);

        let qParams: ParamDef[] = [];
        let jParams: ParamDef[] = [];
        for (const p of params) {
            const idx = p.indexOf(':');
            if (idx === -1) {
                console.log("Not found ':' in param: ", p);
                continue;
            }

            const pType = p.substring(idx + 1, p.length).trim();
            console.log("pType: ", pType);

            if (pType.startsWith('HttpRequest')) {
                continue;
            } else if (pType.startsWith('Query<')) {
                const type = pType.substring(pType.indexOf('<') + 1, pType.indexOf('>'));
                console.log("type: ", type);
                qParams = this.getStructParams(type, lines);
                console.log("qParams: ", qParams);
            } else if (pType.startsWith('Json<')) {
                const type = pType.substring(pType.indexOf('<') + 1, pType.indexOf('>'));
                console.log("type: ", type);
                jParams = this.getStructParams(type, lines);
                console.log("jParams: ", jParams);
            }
        }

        // Process summary, desc and return type
        let start = -1;
        for (let i = range.start.line - 2; i > 0; i--) {
            const line = lines[i].trim();

            if (line === '') {
                start = i;
                break;
            }
        }
        console.log("start: ", start);

        if (start == -1) {
            console.log("Not found the start!");
        }
        
        let summary = '';
        let desc = '';
        let rParams: ParamDef[] = [];
        for (let i = start; i < range.start.line - 1; i++) {
            const line = lines[i].trim();

            if (!line.startsWith('///')) {
                continue;
            }

            let cmt = line;
            if (cmt.startsWith('///')) {
                cmt = cmt.substring(3, cmt.length).trim();
            }

            if (summary === '' && cmt !== '') {
                summary = cmt;

                if (summary.endsWith('。') || summary.endsWith('.')) {
                    summary = summary.substring(0, summary.length - 1);
                }

                summary = summary.replace('"', '\\"');
            }

            if (cmt.indexOf('@returns:') === -1) {
                if (desc !== '') {
                    desc += '\\n';
                }

                desc += cmt;
            }
            desc = desc.replace('"', '\\"');

            if (cmt.indexOf('@returns:') !== -1) {
                const rType = cmt.substring(cmt.indexOf('@returns:') + 9, cmt.length).trim();
                console.log("rType: ", rType);
                rParams = this.getStructParams(rType, lines);
                break;
            }
        }
        console.log("summary: ", summary);
        console.log("desc: ", desc);
        console.log("rParams: ", rParams);

        let paramArr: string[] = [];
        for (let p of qParams) {
            let d = p.desc.replace('"', '\\"');
            paramArr.push(`
                    {
                        "name":"${p.name}",
                        "in":"query",
                        "description":"${d}",
                        "required":${p.required},
                        "type":"${p.type}"
                    }`);
        }

        let reqJParams: string[] = [];
        for (let p of jParams) {
            if (p.required) {
                reqJParams.push(`
                                "${p.name}"`);
            }
        }
        let reqJJoin = reqJParams.join(',');

        let bodyArr: string[] = [];
        for (let p of jParams) {
            let d = p.desc.replace('"', '\\"');
            bodyArr.push(`
                                "${p.name}":{
                                    "type":"${p.type}",
                                    "description":"${d}"
                                }`);
        }
        let bodyJoin = bodyArr.join(',');

        if (bodyJoin !== '') {
            paramArr.push(`
                    {
                        "name":"body",
                        "in":"body",
                        "description":"JSON 格式的 BODY 内容",
                        "required":true,
                        "schema":{
                            "type":"object",
                            "required":[${reqJJoin}
                            ],
                            "properties":{${bodyJoin}
                            }
                        }
                    }`);
        }

        let paramJoin = paramArr.join(',');

        let reqRParams: string[] = [];
        for (let p of rParams) {
            if (p.required) {
                reqRParams.push(`
                                "${p.name}"`);
            }
        }
        let reqRJoin = reqRParams.join(',');

        let returnArr: string[] = [];
        for (let p of rParams) {
            let d = p.desc.replace('"', '\\"');
            let t = p.type;

            if (t === 'string' || t === 'integer' || t === 'number' || t === 'boolean') {
                returnArr.push(`
                                "${p.name}":{
                                    "type":"${p.type}",
                                    "description":"${d}"
                                }`);
            } else {
                const subParams = this.getStructParams(t, lines);

                let reqSubParams: string[] = [];
                for (let p of subParams) {
                    if (p.required) {
                        reqSubParams.push(`
                                        "${p.name}"`);
                    }
                }
                let reqSubJoin = reqSubParams.join(',');
        
                let subArr: string[] = [];

                for (let s of subParams) {
                    let sd = s.desc.replace('"', '\\"');
                    subArr.push(`
                                        "${s.name}":{
                                            "type":"${s.type}",
                                            "description":"${sd}"
                                        }`);
                }
                let subJoin = subArr.join(',');

                returnArr.push(`
                                "${p.name}":{
                                    "type":"object",
                                    "description":"${d}",
                                    "required":[${reqSubJoin}
                                    ],
                                    "properties":{${subJoin}
                                    }
                                }`);
            }
        }
        let returnJoin = returnArr.join(',');

        let host = '';
        if (typeof settings.host === 'string') {
            host = settings.host;
        }
        let basePath = '/';
        if (typeof settings.basePath === 'string') {
            basePath = settings.basePath;
        }
        let schemes = 'https';
        if (typeof settings.schemes === 'string') {
            schemes = settings.schemes.replace(',', '","');
        }

        let consumes = '';
        if (method === 'post') {
            consumes = '"application/json"';
        }

        let template = 
`{
    "swagger":"2.0",
    "host":"${host}",
    "basePath":"${basePath}",
    "schemes":[
        "${schemes}"
    ],
    "paths":{
        "${path}":{
            "${method}":{
                "summary":"${summary}",
                "description":"${desc}",
                "consumes":[
                    ${consumes}
                ],
                "produces":[
                    "application/json"
                ],
                "parameters":[${paramJoin}
                ],
                "responses":{
                    "200":{
                        "description":"请求成功",
                        "schema":{
                            "type":"object",
                            "required":[${reqRJoin}
                            ],
                            "properties":{${returnJoin}
                            }
                        }
                    }
                }
            }
        }
    }
}`;

        let result = template;

        return result;
    }

    private getStructParams(type: string, lines: string[]): ParamDef[] {
        let defs: ParamDef[] = [];

        let defIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].indexOf("pub struct " + type + " {") !== -1) {
                defIdx = i;
            }
        }

        if (defIdx < 0) {
            return defs;
        }

        let comment = '';
        for (let i = defIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.indexOf('}') !== -1) {
                break;
            }

            const cmtIdx = line.indexOf('///');
            if (cmtIdx !== -1) {
                if (comment !== '') {
                    comment += ' ';
                }
                comment += line.substring(cmtIdx + 3, line.length).trim();
            } else {
                // Field def, like:
                //  pub color: String,
                let def = line.trim();
                if (def.startsWith('pub ')) {
                    def = def.substring(4, def.length);
                }
                if (def.endsWith(',')) {
                    def = def.substring(0, def.length - 1);
                }
                console.log("def: ", def);

                const nameType = def.split(':');
                if (nameType.length !== 2) {
                    console.log("nameType.length !== 2, nameType: ", nameType, ", def: ", def);
                } else {
                    let t = nameType[1].trim();
                    const required = !t.startsWith('Option<');
                    if (t.indexOf('<') !== -1) {
                        t = t.substring(t.indexOf('<') + 1, t.indexOf('>'));
                    }

                    let tName = t;
                    let tMap = new Map([
                        ["String", "string"],
                        ["&str", "string"],
                        ["i32", "integer"],
                        ["u32", "integer"],
                        ["i64", "integer"],
                        ["u64", "integer"],
                        ["i128", "integer"],
                        ["u128", "integer"],
                        ["i16", "integer"],
                        ["u16", "integer"],
                        ["i8", "integer"],
                        ["u8", "integer"],
                        ["isize", "integer"],
                        ["usize", "integer"],
                        ["f32", "number"],
                        ["f64", "number"],
                        ["bool", "boolean"],
                    ]);
                    const tVal = tMap.get(t);
                    if (typeof tVal === 'string') {
                        tName = tVal;
                    }
                
                    defs.push(new ParamDef(
                        nameType[0],
                        tName,
                        required,
                        comment,
                    ));
                }
                comment = '';
            }
        }
        
        return defs;
    }
}