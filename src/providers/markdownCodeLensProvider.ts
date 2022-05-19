import { CancellationToken, CodeLens, CodeLensProvider, Command, Range, TextDocument } from 'vscode';
import { Selector } from '../utils/selector';

export class MarkdownCodeLensProvider implements CodeLensProvider {

    public provideCodeLenses(document: TextDocument, _token: CancellationToken): Promise<CodeLens[]> {
        const blocks: CodeLens[] = [];

        for (const range of Selector.getMarkdownRestSnippets(document)) {
            const snippetRange = new Range(range.start.line + 1, 0, range.end.line, 0);
            const cmd: Command = {
                arguments: [document, snippetRange],
                title: 'Generate Swagger',
                command: 'clia-swagger-generator.request',
            };
            blocks.push(new CodeLens(range, cmd));
        }

        return Promise.resolve(blocks);
    }

}