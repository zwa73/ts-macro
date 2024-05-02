import { commentMacro, fileMacro, regionMacro } from "..";



regionMacro('macroTest1',"type Test1 = 1");
regionMacro('macroTest2',"type Test2 = 2");
regionMacro('macroTest3',"type Test3 = 3");

commentMacro('comment1',"type CM1 = 3");
commentMacro('comment2',"type CM2 = 3");

regionMacro('macroTest4',"type Test3 = 4",{filePath:'src/test/**/*.ts',glob:true});

fileMacro("type FileMacro = 5",{filePath:'src/test/testFileMacro.ts'});