**README.md (English)**

# @zwa73/macro

This package provides a macro for code generation/precompilation.

## Features

- Use `regionMacro` to write text into a specific region in a file.
- A command-line interface based on macros for generating code.

## Usage

### regionMacro

The function writes text into a specific region in a file. It accepts a region ID, the text to be written, and an optional target file path.

```typescript
import {regionMacro} from '@zwa73/macro';
regionMacro('regionId', 'codeText', 'path/to/target.ts');
```
In `src/test.macro.ts`:

```typescript
import {regionMacro} from '@zwa73/macro';
regionMacro('macrotest', 'type Test = 1;');
```
In `src/test.ts`:

```typescript
console.log(1);
//#region macrotest
//#endregion
console.log(2);
```
After execution, in `src/test.ts`:

```typescript
console.log(1);
//#region macrotest
type Test = 1;
//#endregion
console.log(2);
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