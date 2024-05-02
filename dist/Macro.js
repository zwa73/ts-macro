"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileMacro = exports.commentMacro = exports.regionMacro = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MiniReq_1 = require("./MiniReq");
//#region macro工具
const parseMacroPaths = (basePath, opt) => {
    return opt?.filePath
        ? opt.glob
            ? MiniReq_1.UtilFT.fileSearchGlob(process.cwd(), opt.filePath)
            : typeof opt?.filePath === "string" ? [opt?.filePath] : opt?.filePath
        : [basePath.replace(/(.+)\.macro\.(js|ts|cjs|mjs)$/, "$1.$2")];
};
const readFile = async (basePath) => (await fs_1.default.promises.readFile(basePath, 'utf-8')).replaceAll("\r\n", "\n");
const parseCodeText = async (codeText, opt) => {
    const strText = typeof codeText === "function" ? await codeText(opt) : codeText;
    return strText.split('\n').map((line) => `${opt.inent}${line}`).join('\n');
};
//#endregion
/**将codeText写入对应region
 * @param regionId   - 区域id \`//#region ${id}\`
 * @param codeText   - 文本
 * @param opt        - 可选参数
 * @param opt.filePath - 目标文件 默认为去除".macro"的同名文件
 * @param opt.glob     - 使用glob匹配而非文件路径
 */
async function regionMacro(regionId, codeText, opt) {
    const loc = MiniReq_1.UtilFunc.getFuncLoc(2);
    if (!loc) {
        MiniReq_1.SLogger.error(`UtilDT.regionMacro 未能找到函数位置`);
        return;
    }
    const plist = [];
    const filePaths = parseMacroPaths(loc.filePath, opt);
    for (const filePath of filePaths) {
        const queuefunc = async () => {
            if (!(await MiniReq_1.UtilFT.pathExists(filePath))) {
                MiniReq_1.SLogger.error(`UtilDT.regionMacro ${filePath} 不存在`);
                return;
            }
            const text = await readFile(filePath);
            const getregex = () => new RegExp(`([^\\S\\n]*)(//#region ${regionId}(?!\\S).*\\n)` +
                /([\s\S]*?)/.source +
                /([^\S\n]*\/\/#endregion(?!\S).*)/.source, "g");
            if (!getregex().test(text)) {
                if (!opt?.glob)
                    MiniReq_1.SLogger.error(`UtilDT.regionMacro 无法找到区域 ${regionId}`);
                return;
            }
            const match = getregex().exec(text);
            const parseCode = await parseCodeText(codeText, { text: (0, MiniReq_1.dedent)(match[3]), inent: match[1], filePath });
            const ntext = text.replace(getregex(), `$1$2${parseCode}\n$4`);
            await fs_1.default.promises.writeFile(filePath, ntext, 'utf-8');
        };
        plist.push(MiniReq_1.UtilFunc.queueProc(path_1.default.posix.normalize(filePath.replaceAll("\\", "/")), queuefunc));
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
    const loc = MiniReq_1.UtilFunc.getFuncLoc(2);
    if (!loc) {
        MiniReq_1.SLogger.error(`UtilDT.commentMacro 未能找到函数位置`);
        return;
    }
    const plist = [];
    const filePaths = parseMacroPaths(loc.filePath, opt);
    for (const filePath of filePaths) {
        const queuefunc = async () => {
            if (!(await MiniReq_1.UtilFT.pathExists(filePath))) {
                MiniReq_1.SLogger.error(`UtilDT.commentMacro ${filePath} 不存在`);
                return;
            }
            const text = await readFile(filePath);
            const getregex = () => new RegExp(`([^\\S\\n]*)(// ${commentId}(?!\\S).*)` +
                /(\n|)/.source +
                /([^\n]*)/.source, "g");
            if (!getregex().test(text)) {
                if (!opt?.glob)
                    MiniReq_1.SLogger.error(`UtilDT.commentMacro 无法找到注释 ${commentId}`);
                return;
            }
            const match = getregex().exec(text);
            const parseCode = await parseCodeText(codeText, { text: match[3], inent: match[1], filePath });
            if (parseCode.includes('\n')) {
                MiniReq_1.SLogger.error(`UtilDT.commentMacro 无法使用多行文本, 考虑使用regionMacro ${codeText}`);
                return;
            }
            const ntext = text.replace(getregex(), `$1$2\n${parseCode}`);
            await fs_1.default.promises.writeFile(filePath, ntext, 'utf-8');
        };
        plist.push(MiniReq_1.UtilFunc.queueProc(path_1.default.posix.normalize(filePath.replaceAll("\\", "/")), queuefunc));
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
    const loc = MiniReq_1.UtilFunc.getFuncLoc(2);
    if (!loc) {
        MiniReq_1.SLogger.error(`UtilDT.fileMacro 未能找到函数位置`);
        return;
    }
    const plist = [];
    const filePaths = parseMacroPaths(loc.filePath, opt);
    for (const filePath of filePaths) {
        const queuefunc = async () => {
            await MiniReq_1.UtilFT.ensurePathExists(filePath);
            const text = await readFile(filePath);
            const parseCode = await parseCodeText(codeText, { text, inent: '', filePath });
            await fs_1.default.promises.writeFile(filePath, parseCode, 'utf-8');
        };
        plist.push(MiniReq_1.UtilFunc.queueProc(path_1.default.posix.normalize(filePath.replaceAll("\\", "/")), queuefunc));
    }
    await Promise.all(plist);
}
exports.fileMacro = fileMacro;
