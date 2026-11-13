---
name: omni-molbio
description: 本地FASTA DNA/RNA IUPAC格式、长度、歧义计数和明确分母的GC统计；仅基础数据QA，不提供临床、功能、序列设计或实验有效性声明。 / Local FASTA DNA/RNA IUPAC format, length, ambiguity counts and explicit-denominator GC statistics; basic data QA only, not clinical, functional, sequence-design or experimental-validity claims.
---

# 基础序列数据QA / Basic sequence-data QA

## 能做与不能做 / Scope and exclusions
可对用户有权提供的非敏感或已获准本地序列做格式/基础统计。先确认DNA或RNA、FASTA来源、允许读取的文件、是否含隐私/受控数据，以及用户需要的统计。不要把病人/个人基因数据上传或外发，也不要以数据统计推断健康结论。 / Analyze authorized local sequence data for format/basic statistics. Establish DNA/RNA, provenance, allowed files, privacy/control status and requested metrics. Never upload/share personal genomic data or infer health from these statistics.

这是原生有界计算，不是完整生物信息套件。**不推断功能/结构/毒性/致病性/疗效，不优化或设计序列，不代替临床/实验/伦理审查，不把GC或图像当科学验证。** 需要这些能力时明确uncovered，先澄清合法用途并寻找独立验证的专业工具/专家，不自行扩展本地助手。 / This is bounded native computation, not a bioinformatics suite. **No function/structure/toxicity/pathogenicity/efficacy inference, sequence design/optimization or substitution for clinical/experimental/ethics review. GC or images are not scientific validation.** Disclose uncovered scope and seek separately validated expertise/tools for legitimate requests rather than silently extending this helper.

## 原生操作与精确语义 / Native operation and exact semantics
从此技能按需读`../../capabilities/README.md`/目录；当前可见shell执行`node <package-root>/capabilities/runner.mjs run molbio.fasta --input <authorized-json>`。JSON必须显式给序列文本和字母表。 / Read guide/catalog on demand; run through the visible shell. JSON explicitly supplies sequence text and alphabet.
```json
{"text":">sample1 local example / 本地示例\nACGTNN\n>sample2\nGCGC\n","alphabet":"dna"}
```
- 标题以`>`开头，首个空白前为唯一非空ID，后面说明不用于计算；先有标题再有非空序列。空行忽略、行端空白裁去、字母转大写；**内部空格、缺口符号、数字、蛋白字母不接受**。 / Header begins `>`, with a unique nonempty first token as ID; descriptions do not enter statistics. Header precedes nonempty sequence. Ignore blank lines, trim line edges and uppercase. **Reject internal whitespace, gaps, digits and protein letters**.
- DNA字母为`ACGTRYSWKMBDHVN`，RNA将T替换为U；不自动把T/U互换。最大文本1,000,000字符、最多10,000条记录。 / DNA uses that IUPAC alphabet, RNA replaces T with U. No automatic T/U conversion. At most 1,000,000 text characters and 10,000 records.
- 每条输出`id,length,counts,ambiguous,gcFractionAll,gcFractionCanonical`。 / Each output record contains those fields.
- `gcFractionAll=(G+C)/length`；`gcFractionCanonical=(G+C)/(A+C+G+T或U)`。纯歧义序列后者为`null`，前者为0；歧义符号**不按概率拆分**。分数是0–1，不是百分数。 / All-base denominator includes ambiguity; canonical denominator excludes it. An all-ambiguous sequence has canonical GC `null` and all-base GC zero. **No probabilistic allocation of ambiguous bases**. Fractions are 0–1, not percentages.

## 错误、验收与输出 / Errors, acceptance and output
格式错误、空序列、ID重复、错误字母表与超限明确失败；不要为了让检查通过而静默删除字符/记录。若用户要求清洗，另列每项变更并取得同意。 / Explicitly fail malformed/empty/duplicate/wrong-alphabet/oversized input. Never silently discard characters/records to get a pass. For requested cleaning, list changes and obtain consent.

只读获准输入；输出包含序列标识/统计，按敏感数据处理。写新文件明确`--out <path> --allow-write`，可加`--root`；不覆盖，不联网，不导入执行外部生物工具。 / Read authorized inputs only. IDs/statistics may be sensitive. Explicit new output path/allow-write, optionally root; no overwrite/network/external scientific-code execution.

验收：手算短序列、全歧义、大小写、多记录、DNA/RNA混用与畸形输入负例；报告分母与缺失值语义。`doctor --test`给出这些契约的实际测试证据，不声称领域/临床/设计验收。 / Accept using hand-computable short/all-ambiguous/mixed-case/multi-record examples plus DNA/RNA and malformed negatives; report denominator/null semantics. Doctor returns actual test evidence for those contracts, not domain/clinical/design acceptance.

来源为`dsh-molbio-tools@0.25.0#molbio-lab`及固定README/patch/index文件哈希；学习可复核计算与生物学结论分界，不运行或安装该来源。详见目录sourceRefs。 / Pinned source files inform the boundary between reproducible computation and biological conclusions; that source was not run or installed. See catalog sourceRefs.
