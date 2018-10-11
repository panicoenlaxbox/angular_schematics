import { Tree, MergeStrategy } from "@angular-devkit/schematics/src/tree/interface";
import { SchematicContext, Rule, SchematicsException, apply, url, filter, noop, move, template, mergeWith, chain, branchAndMerge } from "@angular-devkit/schematics";

import { getProject, buildDefaultPath } from '../utility/project';
import { parseName } from '@schematics/angular/utility/parse-name';
import { strings } from "@angular-devkit/core";
import { InsertChange } from '../utility/change';
import { buildRelativePath, findModuleFromOptions } from '../utility/find-module';
import { addDeclarationToModule, addExportToModule } from '../utility/ast-utils';

import * as ts from 'typescript';

function addDeclarationToNgModule(options: any): Rule {
  return (host: Tree) => {
    if (options.skipImport || !options.module) {
      return host;
    }

    const modulePath = options.module;
    const text = host.read(modulePath);
    if (text === null) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const sourceText = text.toString('utf-8');

    const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);

    const pipePath = `/${options.path}/`
      + (options.flat ? '' : strings.dasherize(options.name) + '/')
      + strings.dasherize(options.name)
      + '.pipe';
    console.log('pipePath', pipePath);
    const relativePath = buildRelativePath(modulePath, pipePath);
    console.log('relativePath', relativePath);
    const changes = addDeclarationToModule(source, modulePath,
      strings.classify(`${options.name}Pipe`),
      relativePath);
    const recorder = host.beginUpdate(modulePath);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(recorder);

    if (options.export) {
      const text = host.read(modulePath);
      if (text === null) {
        throw new SchematicsException(`File ${modulePath} does not exist.`);
      }
      const sourceText = text.toString('utf-8');
      const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);

      const exportRecorder = host.beginUpdate(modulePath);
      const exportChanges = addExportToModule(source, modulePath,
        strings.classify(`${options.name}Pipe`),
        relativePath);

      for (const change of exportChanges) {
        if (change instanceof InsertChange) {
          exportRecorder.insertLeft(change.pos, change.toAdd);
        }
      }
      host.commitUpdate(exportRecorder);
    }

    return host;
  };
}

// ng g my-first-schema:my-first-schema --name carmen --dry-run --module App --project app1
export function myFirstSchema(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _context.logger.info(JSON.stringify(_options));

    if (!_options.project) {
      throw new SchematicsException('Option (project) is required.');
    }
    const project = getProject(tree, _options.project);

    if (_options.path === undefined) {
      _options.path = buildDefaultPath(project);
    }

    const parsedPath = parseName(_options.path, _options.name);
    _options.name = parsedPath.name;
    _options.path = parsedPath.path;

    _options.module = findModuleFromOptions(tree, _options);

    _context.logger.info(JSON.stringify(_options));

    const templateSource = apply(url('./files'), [
      _options.spec ? noop() : filter(path => !path.endsWith('.spec.ts')),
      template({
        ...strings,
        'if-flat': (s: string) => {
          console.log('if-flat', s);
          return _options.flat ? '' : s
        },
        ..._options,
      }),
      move(parsedPath.path)
    ]);

    // return branchAndMerge(
    //   chain([
    //     addDeclarationToNgModule(_options),
    //     mergeWith(templateSource)
    //   ]),
    // );
    return chain([
      addDeclarationToNgModule(_options),
      mergeWith(templateSource)
    ]);
  };
}
