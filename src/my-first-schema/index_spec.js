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
const testing_1 = require("@angular-devkit/schematics/testing");
const path = __importStar(require("path"));
const collectionPath = path.join(__dirname, '../collection.json');
describe('my-first-schema', () => {
    it('works', () => {
        const runner = new testing_1.SchematicTestRunner('schematics', collectionPath);
        const tree = runner.runSchematic('my-first-schema', {}, schematics_1.Tree.empty());
        expect(tree.files).toEqual([]);
    });
});
//# sourceMappingURL=index_spec.js.map