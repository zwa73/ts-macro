"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const glob_1 = require("glob");
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
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
function command() {
    const program = new commander_1.Command();
    program
        .command("Expand-Macro")
        .alias("expandmacro")
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
