export * from '@self-vue/runtime-dom'
import { baseCompile } from "@self-vue/compiler-core";
import * as runtimeDom from "@self-vue/runtime-dom";
import { registerRuntimeCompiler } from "@self-vue/runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);