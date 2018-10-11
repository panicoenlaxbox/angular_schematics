"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const project_1 = require("../utility/project");
const parse_name_1 = require("@schematics/angular/utility/parse-name");
const core_1 = require("@angular-devkit/core");
const change_1 = require("../utility/change");
const find_module_1 = require("../utility/find-module");
const ast_utils_1 = require("../utility/ast-utils");
const ts = __importStar(require("typescript"));
function addDeclarationToNgModule(options) {
    return (host) => {
        if (options.skipImport || !options.module) {
            return host;
        }
        const modulePath = options.module;
        const text = host.read(modulePath);
        if (text === null) {
            throw new schematics_1.SchematicsException(`File ${modulePath} does not exist.`);
        }
        const sourceText = text.toString('utf-8');
        const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
        const pipePath = `/${options.path}/`
            + (options.flat ? '' : core_1.strings.dasherize(options.name) + '/')
            + core_1.strings.dasherize(options.name)
            + '.pipe';
        console.log('pipePath', pipePath);
        const relativePath = find_module_1.buildRelativePath(modulePath, pipePath);
        console.log('relativePath', relativePath);
        const changes = ast_utils_1.addDeclarationToModule(source, modulePath, core_1.strings.classify(`${options.name}Pipe`), relativePath);
        const recorder = host.beginUpdate(modulePath);
        for (const change of changes) {
            if (change instanceof change_1.InsertChange) {
                recorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(recorder);
        if (options.export) {
            const text = host.read(modulePath);
            if (text === null) {
                throw new schematics_1.SchematicsException(`File ${modulePath} does not exist.`);
            }
            const sourceText = text.toString('utf-8');
            const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
            const exportRecorder = host.beginUpdate(modulePath);
            const exportChanges = ast_utils_1.addExportToModule(source, modulePath, core_1.strings.classify(`${options.name}Pipe`), relativePath);
            for (const change of exportChanges) {
                if (change instanceof change_1.InsertChange) {
                    exportRecorder.insertLeft(change.pos, change.toAdd);
                }
            }
            host.commitUpdate(exportRecorder);
        }
        return host;
    };
}
// ng g my-first-schema:my-first-schema --name carmen --dry-run --module App --project app1
function myFirstSchema(_options) {
    return (tree, _context) => {
        _context.logger.info(JSON.stringify(_options));
        if (!_options.project) {
            throw new schematics_1.SchematicsException('Option (project) is required.');
        }
        const project = project_1.getProject(tree, _options.project);
        if (_options.path === undefined) {
            _options.path = project_1.buildDefaultPath(project);
        }
        const parsedPath = parse_name_1.parseName(_options.path, _options.name);
        _options.name = parsedPath.name;
        _options.path = parsedPath.path;
        _options.module = find_module_1.findModuleFromOptions(tree, _options);
        _context.logger.info(JSON.stringify(_options));
        const templateSource = schematics_1.apply(schematics_1.url('./files'), [
            _options.spec ? schematics_1.noop() : schematics_1.filter(path => !path.endsWith('.spec.ts')),
            schematics_1.template(Object.assign({}, core_1.strings, { 'if-flat': (s) => {
                    console.log('if-flat', s);
                    return _options.flat ? '' : s;
                } }, _options)),
            schematics_1.move(parsedPath.path)
        ]);
        // return branchAndMerge(
        //   chain([
        //     addDeclarationToNgModule(_options),
        //     mergeWith(templateSource)
        //   ]),
        // );
        return schematics_1.chain([
            addDeclarationToNgModule(_options),
            schematics_1.mergeWith(templateSource)
        ]);
    };
}
exports.myFirstSchema = myFirstSchema;
//# sourceMappingURL=index.js.map