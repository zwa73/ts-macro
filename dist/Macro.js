"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileMacro = exports.commentMacro = exports.regionMacro = void 0;
const fs_1 = __importDefault(require("fs"));
const pathe_1 = __importDefault(require("pathe"));
const MiniReq_1 = require("./MiniReq");
//#region macro工具
const parseMacroPaths = (opt) => {
    const loc = MiniReq_1.UtilFunc.getFuncLoc(3);
    if (!loc && !opt?.filePath)
        (0, MiniReq_1.throwError)(`parseMacroPaths 未能找到函数位置`);
    const basePath = loc?.filePath;
    return opt?.filePath
        ? opt.glob
            ? MiniReq_1.UtilFT.fileSearchGlob(process.cwd(), opt.filePath)
            : typeof opt?.filePath === "string"
                ? [opt?.filePath]
                : opt?.filePath.map((filepath) => filepath)
        : [basePath.replace(/(.+)\.macro\.(js|ts|cjs|mjs)$/, "$1.$2")];
};
const readFile = async (basePath) => (await fs_1.default.promises.readFile(basePath, 'utf-8')).replaceAll("\r\n", "\n");
const parseCodeText = async (codeText, opt) => {
    const strText = typeof codeText === "function" ? await codeText(opt) : codeText;
    return strText.split('\n').map((line) => `${opt.inent}${line}`).join('\n');
};
const literalRegex = (str) => new RegExp(`^${str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?!\\S)`);
//#endregion
/**将codeText写入对应region
 * @param regionId   - 区域id \`//#region ${id}\`
 * @param codeText   - 文本
 * @param opt        - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
async function regionMacro(regionId, codeText, opt) {
    const plist = [];
    const filePaths = parseMacroPaths(opt);
    for (const filePath of filePaths) {
        const queuefunc = async () => {
            if (!(await MiniReq_1.UtilFT.pathExists(filePath))) {
                MiniReq_1.SLogger.error(`UtilDT.regionMacro ${filePath} 不存在`);
                return;
            }
            let fileText = await readFile(filePath);
            const regex = new RegExp(/(^|\n)([^\S\n]*)(\/\/#region (.*)\n)/.source +
                /([\s\S]*?)/.source +
                /([^\S\n]*\/\/#endregion(?!\S).*)/.source, "g");
            regex.lastIndex = 0;
            let match;
            let hasMatch = false;
            while (match = regex.exec(fileText)) {
                const id = match[4];
                const prefix = match[1];
                const content = match[5];
                const inent = match[2];
                const comment = match[3];
                const endcomment = match[6];
                const idregex = typeof regionId === "string"
                    ? literalRegex(regionId) : regionId;
                let idmatch = idregex.exec(id);
                if (idmatch == null)
                    continue;
                hasMatch = true;
                const ol = fileText.length;
                const parseCode = await parseCodeText(codeText, {
                    matchId: idmatch[0],
                    execArr: idmatch,
                    text: (0, MiniReq_1.dedent)(content),
                    inent,
                    filePath
                });
                fileText = fileText.replace(match[0], `${prefix}${inent}${comment}${parseCode}\n${endcomment}`);
                regex.lastIndex += fileText.length - ol;
            }
            if (hasMatch)
                await fs_1.default.promises.writeFile(filePath, fileText, 'utf-8');
            else if (!opt?.glob)
                MiniReq_1.SLogger.error(`UtilDT.regionMacro 无法找到区域 ${regionId}`);
        };
        plist.push(MiniReq_1.UtilFunc.queueProc(pathe_1.default.normalize(filePath), queuefunc));
    }
    await Promise.all(plist);
}
exports.regionMacro = regionMacro;
/**将codeText写入对应注释下
 * @param commentId - 注释id \`// ${id}\`
 * @param codeText  - 文本
 * @param opt       - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
async function commentMacro(commentId, codeText, opt) {
    const plist = [];
    const filePaths = parseMacroPaths(opt);
    for (const filePath of filePaths) {
        const queuefunc = async () => {
            if (!(await MiniReq_1.UtilFT.pathExists(filePath))) {
                MiniReq_1.SLogger.error(`UtilDT.commentMacro ${filePath} 不存在`);
                return;
            }
            let fileText = await readFile(filePath);
            const regex = new RegExp(/(^|\n)([^\S\n]*)(\/\/ (.*))(\n|)/.source +
                /([^\n]*)/.source, "g");
            let match;
            let hasMatch = false;
            while (match = regex.exec(fileText)) {
                const id = match[4];
                const prefix = match[1];
                const content = match[6];
                const inent = match[2];
                const comment = match[3];
                const idregex = typeof commentId === "string"
                    ? literalRegex(commentId) : commentId;
                let idmatch = idregex.exec(id);
                if (idmatch == null)
                    continue;
                hasMatch = true;
                const ol = fileText.length;
                const parseCode = await parseCodeText(codeText, {
                    matchId: idmatch[0],
                    execArr: idmatch,
                    text: (0, MiniReq_1.dedent)(content),
                    inent,
                    filePath
                });
                if (parseCode.includes('\n')) {
                    MiniReq_1.SLogger.error(`UtilDT.commentMacro 无法使用多行文本, 考虑使用regionMacro ${codeText}`);
                    return;
                }
                fileText = fileText.replace(match[0], `${prefix}${inent}${comment}\n${parseCode}`);
                regex.lastIndex += fileText.length - ol;
            }
            if (hasMatch)
                await fs_1.default.promises.writeFile(filePath, fileText, 'utf-8');
            else if (!opt?.glob)
                MiniReq_1.SLogger.error(`UtilDT.commentMacro 无法找到注释 ${commentId}`);
        };
        plist.push(MiniReq_1.UtilFunc.queueProc(pathe_1.default.normalize(filePath), queuefunc));
    }
    await Promise.all(plist);
}
exports.commentMacro = commentMacro;
/**将codeText写入对应文件 不存在则创建
 * @param codeText  - 文本
 * @param opt       - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
async function fileMacro(codeText, opt) {
    const plist = [];
    const filePaths = parseMacroPaths(opt);
    for (const filePath of filePaths) {
        const queuefunc = async () => {
            await MiniReq_1.UtilFT.ensurePathExists(filePath);
            const text = await readFile(filePath);
            const parseCode = await parseCodeText(codeText, {
                matchId: '',
                execArr: /''/.exec(''),
                text,
                inent: '',
                filePath
            });
            await fs_1.default.promises.writeFile(filePath, parseCode, 'utf-8');
        };
        plist.push(MiniReq_1.UtilFunc.queueProc(pathe_1.default.normalize(filePath), queuefunc));
    }
    await Promise.all(plist);
}
exports.fileMacro = fileMacro;
