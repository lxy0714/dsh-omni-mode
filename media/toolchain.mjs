import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {contained,fail} from './project.mjs';
export async function loadRenderer(toolEnv){
 if(!toolEnv)fail('BLOCKED --tool-env is required; setup is explicit / 缺少显式工具环境，请先按说明配置');
 const root=await fs.realpath(toolEnv),manifest=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 if(manifest.dependencies?.['@resvg/resvg-js']!=='2.6.2')fail('tool-env must directly pin @resvg/resvg-js 2.6.2 / 工具环境必须直接锁定版本');
 const packageDir=await fs.realpath(path.join(root,'node_modules/@resvg/resvg-js'));if(!contained(root,packageDir))fail('renderer escapes tool-env / 渲染器逃逸工具环境');
 const pkg=JSON.parse(await fs.readFile(path.join(packageDir,'package.json'),'utf8'));if(pkg.version!=='2.6.2')fail('renderer version mismatch / 渲染器版本不符');
 if(process.platform!=='linux'||!['arm64','x64'].includes(process.arch))fail('BLOCKED supported native runner targets Linux arm64/x64 / 当前原生运行器支持Linux arm64或x64');
 const libc=process.report.getReport().header.glibcVersionRuntime?'gnu':'musl',nativeName=`@resvg/resvg-js-linux-${process.arch}-${libc}`;
 const nativeDir=await fs.realpath(path.join(root,'node_modules',nativeName));if(!contained(root,nativeDir))fail('native renderer escapes tool-env / 原生渲染器逃逸工具环境');
 const native=JSON.parse(await fs.readFile(path.join(nativeDir,'package.json'),'utf8'));if(native.version!=='2.6.2')fail('native renderer version mismatch / 原生渲染器版本不符');
 const require=createRequire(path.join(packageDir,'package.json')),resolvedNative=await fs.realpath(require.resolve(nativeName));if(!contained(nativeDir,resolvedNative))fail('native resolution used undeclared hoisting / 原生模块解析使用未声明提升依赖');
 const {Resvg}=require(path.join(packageDir,pkg.main??'index.js'));
 return {Resvg,version:pkg.version,nativePackage:nativeName,root};
}
