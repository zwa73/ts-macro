"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dedent = exports.SLogger = exports.UtilFunc = exports.UtilFT = void 0;
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
var UtilFT;
(function (UtilFT) {
    /**搜索符合Glob匹配的文件
     * @param dir         - 起始目录
     * @param globPattern - glob匹配
     * @param opt         - 可选参数
     * @param opt.ignore    - 忽略的文件
     * @param opt.normalize - 输出的路径风格 默认跟随系统
     * @returns 文件绝对路径数组
     */
    function fileSearchGlob(dir, globPattern, opt) {
        const fixedPath = typeof globPattern === "string"
            ? path_1.default.join(dir, globPattern).replaceAll("\\", "/")
            : globPattern.map((p) => path_1.default.join(dir, p).replaceAll("\\", "/"));
        return (0, glob_1.globSync)(fixedPath, { ignore: opt?.ingore, absolute: true })
            .map((filePath) => {
            if (opt?.normalize === undefined)
                return filePath;
            switch (opt.normalize) {
                case 'posix':
                    return path_1.default['posix'].normalize(filePath.replaceAll("\\", "/"));
                case 'win32':
                    return path_1.default['win32'].normalize(filePath.replaceAll("/", "\\"));
            }
            throw '';
        });
    }
    UtilFT.fileSearchGlob = fileSearchGlob;
    /**验证路径 文件或文件夹 是否存在 异步
     * @async
     * @param filePath - 待验证的路径
     * @returns 是否存在
     */
    async function pathExists(filePath) {
        try {
            await fs_1.default.promises.access(filePath);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    UtilFT.pathExists = pathExists;
    /**确保路径存在 不存在时创建 异步
     * @async
     * @param filePath - 待验证的路径
     * @param opt      - 可选参数
     * @param opt.dir  - 强制验证一个文件夹
     * @returns 是否成功执行 创建或已存在
     */
    async function ensurePathExists(filePath, opt) {
        if (await pathExists(filePath))
            return true;
        return await createPath(filePath, opt);
    }
    UtilFT.ensurePathExists = ensurePathExists;
    /**路径不存在时创建路径 以path.sep结尾时创建文件夹 异步
     * @async
     * @param filePath - 待创建的路径
     * @param opt      - 可选参数
     * @param opt.dir  - 创建一个目录
     * @returns 是否成功创建
     */
    async function createPath(filePath, opt) {
        if (opt?.dir == true)
            filePath = path_1.default.join(filePath, path_1.default.sep);
        try {
            if (filePath.endsWith(path_1.default.sep)) {
                await fs_1.default.promises.mkdir(filePath, { recursive: true });
                return true;
            }
            await fs_1.default.promises.mkdir(path_1.default.dirname(filePath), { recursive: true });
            const filehandle = await fs_1.default.promises.open(filePath, 'w');
            await filehandle.close();
            return true;
        }
        catch (e) {
            SLogger.error("createPath 错误", e);
            return false;
        }
    }
    UtilFT.createPath = createPath;
})(UtilFT || (exports.UtilFT = UtilFT = {}));
var UtilFunc;
(function (UtilFunc) {
    /**代办表 用于队列处理等待 */
    const pendingMap = {};
    /**队列处理
     * 等待标签为 flag 的队列
     * 直到排在之前的任务全部完成再处理当前Promise
     * @param flag - 队列标签
     * @param task - 任务逻辑
     * @returns 处理结果
     */
    function queueProc(flag, task) {
        // 如果当前标签的队列不存在，则创建一个新的队列
        if (!pendingMap[flag])
            pendingMap[flag] = [];
        // 创建一个新的Promise，并保存resolve函数以便后续调用
        let resolveFunc;
        const promise = new Promise((resolve) => {
            resolveFunc = resolve;
        });
        // 定义处理任务的函数
        const processTask = async () => {
            let result;
            try {
                // 执行任务并等待结果
                result = await task();
                // 使用保存的resolve函数来解决Promise
                resolveFunc(result);
            }
            catch (error) {
                // 如果任务执行出错，记录错误日志
                console.warn(`queueProc 错误: `, error, `flag: ${String(flag)}`);
            }
            finally {
                // 无论任务是否成功，都从队列中移除当前任务
                pendingMap[flag].shift();
                // 如果队列中还有任务，执行下一个任务
                if (pendingMap[flag].length > 0) {
                    pendingMap[flag][0]();
                }
                else {
                    // 如果队列中没有任务，删除队列
                    delete pendingMap[flag];
                }
            }
        };
        // 将处理任务的函数添加到队列中
        pendingMap[flag].push(processTask);
        // 如果队列中只有当前任务，立即执行
        if (pendingMap[flag].length === 1)
            processTask();
        // 返回Promise，以便调用者可以等待任务完成
        return promise;
    }
    UtilFunc.queueProc = queueProc;
    /**获取函数调用位置 getFunctionLocation
     * @param stack - 深度 默认1, 即getFuncLoc函数被调用的位置
     */
    function getFuncLoc(stack = 1) {
        const stackLines = new Error().stack.split('\n');
        const regex = /([a-zA-Z]+?:.+?):(\d+?:\d+)/;
        //console.log(stackLines)
        const match = regex.exec(stackLines[stack + 1]);
        if (match) {
            const filePath = match[1];
            const lineNumber = match[2];
            return { filePath, lineNumber };
        }
        return undefined;
    }
    UtilFunc.getFuncLoc = getFuncLoc;
})(UtilFunc || (exports.UtilFunc = UtilFunc = {}));
var SLogger;
(function (SLogger) {
    SLogger.info = (...arg) => console.info(...arg);
    SLogger.error = (...arg) => console.error(...arg);
})(SLogger || (exports.SLogger = SLogger = {}));
/**移除多行字符串中每行开始的最小空格数。
 *
 * @param input   - 需要处理的多行 字符串模板 或 字符串。
 * @param values  - 插入模板字符串中的值。
 * @returns 返回处理后的字符串，每行开始的空格数已被最小化。
 *
 * @example
 * const name = 'World';
 * const str = dedent`
 *     Hello,
 *         ${name}!
 * `;
 * console.log(str);
 * // 输出：
 * // Hello,
 * //     World!
 */
function dedent(input, ...values) {
    const str = typeof input === 'string'
        ? input
        : input.reduce((result, string, i) => result + string + (values[i] ?? ''), '');
    const lines = str.split('\n');
    const minIndent = Math.min(...lines.filter(line => line.trim() !== '').map(line => line.search(/\S/)));
    return lines.map(line => line.slice(minIndent)).join('\n');
}
exports.dedent = dedent;
