"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = exports.$macro = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const glob_1 = require("glob");
const commander_1 = require("commander");
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
/**获取函数调用位置 getFunctionLocation
 * @param stack - 深度 默认1, 即getFuncLoc函数被调用的位置
 */
function getFuncLoc(stack = 1) {
    const stackLines = new Error().stack.split('\n');
    const regex = /([a-zA-Z]+?:.+?):(\d+?:\d+?)/;
    //console.log(stackLines)
    const match = regex.exec(stackLines[stack + 1]);
    if (match) {
        const filePath = match[1];
        const lineNumber = match[2];
        return { filePath, lineNumber };
    }
    return undefined;
}
/**运行所有js/ts文件
 * @async
 * @param filepath - 需要运行的文件
 * @param opt      - 可选参数
 * @param opt.project  - tsconfig路径
 */
async function batchNode(filepath, opt) {
    // 确保 filepath 总是一个数组
    if (!Array.isArray(filepath))
        filepath = [filepath];
    // 将所有的相对路径转换为绝对路径
    const absolutePaths = filepath.map(fp => path_1.default.resolve(process.cwd(), fp).replaceAll("\\", "/"));
    // 创建一个字符串，其中包含所有文件的 require 语句
    const requires = absolutePaths.map(fp => `require('${fp}');`).join('\n');
    // 创建并执行 ts-node 命令
    const cmd = `ts-node -r tsconfig-paths/register -e "${requires}" ${opt?.project ? `-P "${opt.project}"` : ""}`;
    await exec(cmd);
}
/**封装的 cp.spawn 执行一段指令，指令运行时实时返回输出
 * @param command - 指令文本
 */
function exec(command) {
    return new Promise((resolve, reject) => {
        const child = child_process_1.default.spawn(command, { shell: true });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data;
            console.log(data.toString());
        });
        child.stderr.on('data', (data) => {
            stderr += data;
            console.error(data.toString());
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code !== 0)
                console.warn(`UtilFunc.exec 命令:"${command}" 结束 代码为:${code}`);
            resolve({ stdout, stderr });
        });
    });
}
/**将codeText写入对应region
 * @param regionId   - 区域id
 * @param codeText   - 文本
 * @param targetPath - 目标文件 默认为去除".macro"的同名文件
 */
async function $macro(regionId, codeText, targetPath) {
    const loc = getFuncLoc(2);
    if (!loc) {
        console.error(`$macro 未能找到函数位置`);
        return;
    }
    ;
    const baseFilePath = targetPath
        ? path_1.default.resolve(process.cwd(), targetPath)
        : loc.filePath.replace(/(.+)\.macro\.(js|ts|cjs|mjs)$/, "$1.$2");
    const queuefunc = async () => {
        if (!(await pathExists(baseFilePath))) {
            console.error(`$macro ${baseFilePath} 不存在`);
            return;
        }
        ;
        const text = (await fs_1.default.promises.readFile(baseFilePath, 'utf-8')).replaceAll("\r\n", "\n");
        const getregex = () => new RegExp(`([^\\S\\n]*)(//#region ${regionId}(?!\\S).*\\n)` +
            /([\s\S]*?)/.source +
            /([^\S\n]*\/\/#endregion(?!\S).*)/.source, "g");
        if (!(getregex().test(text))) {
            console.error(`$macro 无法找到区域 ${regionId}`);
            return;
        }
        const match = getregex().exec(text);
        const mapText = codeText.split('\n').map((line) => `${match[1]}${line}`).join('\n');
        const ntext = text.replace(getregex(), `$1$2${mapText}\n$4`);
        await fs_1.default.promises.writeFile(baseFilePath, ntext, 'utf-8');
    };
    await queueProc(path_1.default.posix.normalize(baseFilePath.replaceAll("\\", "/")), queuefunc);
}
exports.$macro = $macro;
function command() {
    const program = new commander_1.Command();
    program
        .command("Build-Macro")
        .alias("buildmacro")
        .description("生成根据macro生成代码")
        .option("-i, --include <glob>", "包含的glob 默认 src/**/*.macro.ts", "src/**/*.macro.ts")
        .option("-g, --exclude <glob>", "忽略的glob")
        .option("-p, --project <path>", "tsconfig路径 默认tsconfig.json", "tsconfig.json")
        .action(async (opt) => {
        const dir = process.cwd();
        const include = opt.include;
        const fixedPath = typeof include === "string"
            ? path_1.default.join(dir, include).replaceAll("\\", "/")
            : include.map((p) => path_1.default.join(dir, p).replaceAll("\\", "/"));
        const filelist = (0, glob_1.globSync)(fixedPath, { ignore: opt?.ingore, absolute: true })
            .map((filePath) => path_1.default.posix.normalize(filePath.replaceAll("\\", "/")));
        await batchNode(filelist, {
            project: opt.project,
        });
    });
    program.parse(process.argv);
}
exports.command = command;
