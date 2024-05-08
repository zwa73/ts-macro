
import { globSync } from 'glob';
import { Command } from 'commander';
import path from 'pathe';
import cp from 'child_process';
/**执行js/ts的可选项 */
type BatchNodeOpt = Partial<{
    /**tsconfig路径 */
    project:string;
}>

/**运行所有js/ts文件  
 * @async
 * @param filepath - 需要运行的文件
 * @param opt      - 可选参数
 * @param opt.project  - tsconfig路径
 */
async function batchNode(filepath:string|string[],opt?:BatchNodeOpt) {
    // 确保 filepath 总是一个数组
    if (!Array.isArray(filepath)) filepath = [filepath];
    // 将所有的相对路径转换为绝对路径
    const absolutePaths = filepath.map(fp => path.resolve(process.cwd(), fp));
    // 创建一个字符串，其中包含所有文件的 require 语句
    const requires = absolutePaths.map(fp => `require('${fp}')`).join(';');
    // 创建并执行 ts-node 命令
    const cmd = `ts-node -r tsconfig-paths/register -e "${requires}" ${opt?.project?`-P "${opt.project}"` : ""}`;
    await exec(cmd);
}

/**封装的 cp.spawn 执行一段指令，指令运行时实时返回输出
 * @param command - 指令文本
 */
function exec(command: string) {
    return new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
        const child = cp.spawn(command,{shell:true});

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
            if (code!==0) console.warn(`UtilFunc.exec 命令:"${command}" 结束 代码为:${code}`);
            resolve({ stdout, stderr });
        });
    });
}

export function command(){
    const program = new Command();
    program
        .command("Expand-Macro")
        .alias("expandmacro")
        .description("生成根据macro生成代码")
        .option("-i, --include <glob>", "包含的glob 默认 src/**/*.macro.ts","src/**/*.macro.ts")
        .option("-g, --exclude <glob>", "忽略的glob")
        .option("-p, --project <path>", "tsconfig路径 默认tsconfig.json","tsconfig.json")
        .action(async (opt) => {
            const dir = process.cwd();
            const include:string|string[] = opt.include;
            const fixedPath = typeof include === "string"
                ? path.join(dir,include)
                : include.map((p)=>path.join(dir,p));
            const filelist = globSync(fixedPath, { ignore: opt?.ingore, absolute: true })
                .map((filePath) => path.normalize(filePath));
            await batchNode(filelist, {
                project: opt.project,
            });
        });
    program.parse(process.argv);
}