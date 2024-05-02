**README.md (English)**

# @zwa73/macro

This package provides a macro for code generation/precompilation.

## Features

- Use `regionMacro` to write text into a specific region in a file.
- A command-line interface based on macros for generating code.

## Usage

### regionMacro

The `regionMacro` function writes the `codeText` into the corresponding region.

- `regionId`: The region id `//#region ${id}`.
- `codeText`: The text to be written.
- `opt`: Optional parameters.
  - `opt.filePath`: The target file. The default is the same name file without ".macro".
  - `opt.glob`: Use glob matching instead of file path.

This function is used when you want to write specific code text into a designated region in a file.

### commentMacro

The `commentMacro` function writes the `codeText` under the corresponding comment.

- `commentId`: The comment id `// ${id}`.
- `codeText`: The text to be written.
- `opt`: Optional parameters.
  - `opt.filePath`: The target file. The default is the same name file without ".macro".
  - `opt.glob`: Use glob matching instead of file path.

This function is used when you want to write specific code text under a designated comment in a file.

### fileMacro

The `fileMacro` function writes the `codeText` into the corresponding file. If the file does not exist, it will be created.

- `codeText`: The text to be written.
- `opt`: Optional parameters.
  - `opt.filePath`: The target file. The default is the same name file without ".macro".
  - `opt.glob`: Use glob matching instead of file path.

This function is used when you want to write specific code text into a designated file. If the file does not exist, it will be created.

## Example

In `src/test.macro.ts`:

```typescript
import {regionMacro} from '@zwa73/macro';
regionMacro('region1', 'type Region = 1;');
commentMacro('comment1', 'type Comment = 1;');
fileMacro('type FileMacro = 1;',{filePath:'src/testFileMacro.ts'});
```
In `src/test.ts`:

```typescript
console.log(1);
//#region region1
//#endregion
console.log(2);
// comment1
// comment2
// comment3
```
After execution, in `src/test.ts`:

```typescript
console.log(1);
//#region region1
type Region = 1;
//#endregion
console.log(2);
// comment1
type Comment = 1;
// comment3
```

And create `src/testFileMacro.ts`:

```typescript
type FileMacro = 1;
```

### Command-Line Interface

This package also provides a command-line interface for generating code based on macros.

- -i, --include <glob> Include glob, default is src/**/*.macro.ts  
- -g, --exclude <glob> Exclude glob  
- -p, --project <path> Path to tsconfig, default is tsconfig.json  

```powershell
npx zmacro Expand-Macro --include "src/**/*.macro.ts" --project "tsconfig.json"
```

This command will run all files matching src/**/*.macro.ts and generate code as shown in the example above.

## Installs

```powershell
npm i --save-dev @zwa73/macro
```