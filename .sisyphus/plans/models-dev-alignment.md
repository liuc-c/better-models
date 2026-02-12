# models.dev 对齐与数据正确性修复计划

## TL;DR

> **Quick Summary**: 将本地 `better-models` 与上游 `anomalyco/models.dev` 的真实 schema 完整对齐，修复当前最严重的价格单位错误（误标 `/1K`），并补齐缺失字段展示与类型覆盖，确保 UI 与 API 语义一致。
>
> **Deliverables**:
> - 价格单位统一改为 **per 1M tokens**（卡片、详情、中英文文案）
> - 本地 TypeScript 类型覆盖上游关键字段（`status`、`provider`、`limit.input`、扩展 `cost`）
> - 详情页支持展示新增字段（reasoning/audio/context_over_200k/input limit/interleaved）
> - provider 覆盖逻辑修复（model-level provider 优先）
> - 状态标记（deprecated/alpha/beta）可见化
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 6

---

## Context

### Original Request
“仔细对比 `https://github.com/anomalyco/models.dev` 与本地项目，识别所有模型字段与含义，找出 bug 和缺失项，尤其价格单位（上游 M，本地被写成 K），先分析差异，再给出修改计划。”

### Interview Summary
**Key Discussions**:
- 上游 `models.dev` 是权威数据源，本地只消费 `https://models.dev/api.json`
- 当前最明显错误是单位标注：本地 `/1K` 与上游 “per million” 不一致
- 需要先完整 schema 对比，再做精确修复计划

**Research Findings**:
- 上游 schema（`packages/core/src/schema.ts`）定义：
  - `interleaved`: `true | { field: "reasoning_content" | "reasoning_details" }`
  - `status`: `"alpha" | "beta" | "deprecated"`
  - `limit.input` 可选
  - `cost` 可选扩展字段：`reasoning`, `input_audio`, `output_audio`, `context_over_200k`
- API 快照统计：88 providers / 2552 models
  - `interleaved` boolean: 23，object: 148
  - model-level `provider` override: 31
  - `limit.input` present: 75
  - `cost.reasoning`: 41, `input_audio`: 23, `output_audio`: 13, `context_over_200k`: 23

### Metis Review
**Identified Gaps** (addressed in this plan):
- 未显式定义“只改标签不改价格数值”的 guardrail
- 未覆盖 model-level provider override 的展示正确性
- 未覆盖 `interleaved=true` 的展示行为
- 未明确 advanced cost 字段展示位置导致潜在 UI 膨胀

---

## Work Objectives

### Core Objective
让本地 UI/类型系统与上游 `models.dev` 的字段语义保持一致，避免误导性价格单位与字段丢失，确保用户看到的是“真实、完整、可解释”的模型数据。

### Concrete Deliverables
- `src/types.ts`：补齐并收敛 schema 类型
- `src/lib/utils.ts`：provider 优先级与数据扁平化一致性
- `src/components/ModelCard.tsx`：单位从 `/1K` 修复为 `/1M`
- `src/components/ModelDetailSheet.tsx`：新增字段可视化（条件展示）
- `src/i18n/locales/en.json`、`src/i18n/locales/zh.json`：单位文案修正与新增字段文案

### Definition of Done
- [ ] 页面中不再出现任何 `/1K` 或 “per 1K tokens” 文案
- [ ] 至少一个 `deprecated` 模型可视化状态标记
- [ ] 至少一个 model-level provider override 模型展示正确 provider npm
- [ ] 详情页可展示 `limit.input`、`cost.reasoning`、`cost.input_audio`、`cost.output_audio`、`cost.context_over_200k`（当字段存在时）
- [ ] `pnpm lint` 与 `pnpm build` 通过

### Must Have
- 价格单位全部对齐为 **per 1M tokens**
- 保持 API 原始价格数值不变（仅单位标签修正）
- 向后兼容：缺失字段不报错、不破 UI

### Must NOT Have (Guardrails)
- ❌ 不做价格换算（禁止乘除 1000/1000000 改数值）
- ❌ 不新增本地模型数据源（仍以 `models.dev/api.json` 为准）
- ❌ 不进行无关 UI 重构（只做必要展示补齐）
- ❌ 不引入范围外功能（如复杂状态筛选器、本地缓存重构）

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> 所有验收必须由执行代理自动完成，不依赖人工点击/目测确认。

### Test Decision
- **Infrastructure exists**: NO（`package.json` 无 test 脚本/框架）
- **Automated tests**: None（本次不新增测试框架）
- **Framework**: none

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> 无单测框架时，QA 场景为主验证手段。

**Verification Tool by Deliverable Type**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| Frontend/UI | Playwright | 导航、搜索、打开详情、DOM 断言、截图 |
| API/Data probe | Bash (node) | 读取 api.json，提取样本模型 ID |
| Build quality | Bash | 执行 lint/build 并校验退出码 |

---

## Execution Strategy

### Parallel Execution Waves

```text
Wave 1 (Start Immediately):
├── Task 1: 类型与 schema 对齐
└── Task 3: 价格单位与文案修复

Wave 2 (After Wave 1):
├── Task 2: provider override 与扁平化逻辑
├── Task 4: 详情页字段补齐与 interleaved 安全展示
└── Task 5: status 标记可视化

Wave 3 (After Wave 2):
└── Task 6: 全链路 QA + 回归验证 + 证据归档

Critical Path: 1 → 2 → 4 → 6
Parallel Speedup: ~35%
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 4, 5 | 3 |
| 2 | 1 | 4, 6 | 5 |
| 3 | None | 4, 6 | 1 |
| 4 | 1, 2, 3 | 6 | 5 |
| 5 | 1 | 6 | 2, 4 |
| 6 | 2, 3, 4, 5 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 3 | `task(category="unspecified-high", load_skills=[], run_in_background=false)` |
| 2 | 2, 4, 5 | UI task 可用 `category="visual-engineering"` |
| 3 | 6 | `category="unspecified-high"` 执行 QA 与构建验证 |

---

## TODOs

- [x] 1. 本地类型系统与上游 schema 全量对齐

  **What to do**:
  - 更新 `ModelCost`：补齐 `reasoning`, `input_audio`, `output_audio`, `context_over_200k`
  - 更新 `ModelLimit`：补齐 `input?: number`
  - 更新 `Model`：补齐 `status?: 'alpha' | 'beta' | 'deprecated'`、`provider?: { npm?: string; api?: string }`
  - 更新 `interleaved` 类型为 `true | { field: 'reasoning_content' | 'reasoning_details' }`

  **Must NOT do**:
  - 不把新增字段设成必填（API 存在大量可选字段）
  - 不变更现有字段名称（保持与 API 键名一致）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要精确类型建模与兼容性控制
  - **Skills**: `[]`
    - 无特定技能依赖，重点是类型一致性
  - **Skills Evaluated but Omitted**:
    - `vitest`: 本任务不引入测试框架

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: 2, 4, 5
  - **Blocked By**: None

  **References**:
  - `src/types.ts:1-35` - 当前本地类型定义基线
  - `https://raw.githubusercontent.com/anomalyco/models.dev/dev/packages/core/src/schema.ts` - 上游权威 schema
  - `https://github.com/anomalyco/models.dev/blob/dev/README.md#schema-reference` - 字段语义说明

  **Acceptance Criteria**:
  - [ ] `src/types.ts` 包含上述新增字段与联合类型
  - [ ] `pnpm build` 成功

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Type alignment compiles cleanly
    Tool: Bash
    Preconditions: Dependencies installed (pnpm install done)
    Steps:
      1. Run: pnpm build
      2. Assert: exit code = 0
      3. Assert: output contains no TypeScript type errors
    Expected Result: Build succeeds with updated types
    Failure Indicators: TS compile errors referencing Model/ModelCost/ModelLimit
    Evidence: .sisyphus/evidence/task-1-build.txt

  Scenario: Optional-field compatibility retained
    Tool: Bash (node)
    Preconditions: API reachable
    Steps:
      1. Run node script to fetch https://models.dev/api.json and sample models missing optional fields
      2. Assert script completes without runtime type assumptions (no thrown errors)
      3. Save sampled model ids for downstream UI QA
    Expected Result: Missing fields do not break data handling assumptions
    Failure Indicators: script throws due required-field assumptions
    Evidence: .sisyphus/evidence/task-1-optional-fields.txt
  ```

  **Commit**: YES
  - Message: `fix(types): align local model interfaces with upstream schema`

---

- [ ] 2. 扁平化逻辑支持 model-level provider override（修复 provider 展示偏差）

  **What to do**:
  - 在 `flattenModels` 中为 provider 元数据建立优先级：`model.provider` > provider-level
  - 让 `providerNpm/providerApi` 使用“生效后”值，避免 opencode 等聚合 provider 显示错误 npm
  - 保持其余字段原样透传

  **Must NOT do**:
  - 不覆盖 providerName/id（来源仍保持上层 provider）
  - 不引入业务推断（仅按字段优先级合并）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及核心数据映射层，影响全局展示
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 本任务以数据逻辑为主

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: 4, 6
  - **Blocked By**: 1

  **References**:
  - `src/lib/utils.ts:103-127` - 当前 flattenModels 逻辑
  - `src/types.ts:49-56` - FlattenedModel provider 字段
  - `https://raw.githubusercontent.com/anomalyco/models.dev/dev/packages/core/src/schema.ts` - `provider` 为 model 级可选字段

  **Acceptance Criteria**:
  - [ ] 对带 `model.provider.npm` 的模型，详情页展示该 npm
  - [ ] 无 override 的模型保持原 provider npm/api 展示

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Override provider npm takes precedence
    Tool: Playwright
    Preconditions: Dev server running on http://localhost:5173
    Steps:
      1. Navigate to app homepage
      2. Search model id/name containing "gpt-5-codex" under provider "opencode"
      3. Open model detail sheet
      4. Assert DetailRow label "NPM Package" text equals "@ai-sdk/openai"
      5. Screenshot: .sisyphus/evidence/task-2-provider-override.png
    Expected Result: Model-level override npm is shown
    Failure Indicators: shows provider-level npm instead of override
    Evidence: .sisyphus/evidence/task-2-provider-override.png

  Scenario: Non-override model remains unchanged
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Search "claude sonnet"
      2. Open a non-override model detail
      3. Assert NPM Package still matches provider-level package
    Expected Result: Default provider metadata still valid
    Failure Indicators: blank/incorrect npm for non-override model
    Evidence: .sisyphus/evidence/task-2-provider-default.png
  ```

  **Commit**: YES
  - Message: `fix(data): honor model-level provider override in flattening`

---

- [x] 3. 修复价格单位标签与多语言文案（/1K → /1M）

  **What to do**:
  - 更新 `ModelCard` 中输入/输出成本后缀为 `/1M`
  - 更新 i18n 文案：
    - `en.detail.pricing`: `Pricing (per 1M tokens)`
    - `zh.detail.pricing`: `定价（每 1M tokens）`
  - 若有其它单位文案，统一改为 1M 口径

  **Must NOT do**:
  - 不更改 `formatCost()` 数值逻辑
  - 不进行币种/数值换算

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 改动点集中且范围明确
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 非视觉重设计，仅文本修复

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: 4, 6
  - **Blocked By**: None

  **References**:
  - `src/components/ModelCard.tsx:167-174` - `/1K` 硬编码位置
  - `src/i18n/locales/en.json:79` - 英文 pricing 单位文案
  - `src/i18n/locales/zh.json:79` - 中文 pricing 单位文案
  - `https://github.com/anomalyco/models.dev/blob/dev/README.md` - 上游明确 per million

  **Acceptance Criteria**:
  - [ ] 页面不再出现 `/1K` 文案
  - [ ] 页面不再出现 `per 1K tokens` / `每 1K tokens`
  - [ ] 卡片输入/输出价格后缀均为 `/1M`

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Card pricing suffix corrected globally
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open homepage
      2. Wait for model cards rendered
      3. Assert at least one visible card contains text "/1M"
      4. Assert page text does NOT contain "/1K"
      5. Screenshot: .sisyphus/evidence/task-3-card-unit.png
    Expected Result: Unit suffix uses /1M everywhere on cards
    Failure Indicators: any /1K remains
    Evidence: .sisyphus/evidence/task-3-card-unit.png

  Scenario: Detail pricing label corrected in both locales
    Tool: Playwright
    Preconditions: Dev server running, language switch available
    Steps:
      1. Switch language to English; open any model detail
      2. Assert heading includes "Pricing (per 1M tokens)"
      3. Switch language to 中文; reopen detail
      4. Assert heading includes "定价（每 1M tokens）"
      5. Screenshot: .sisyphus/evidence/task-3-i18n-unit.png
    Expected Result: Both locales aligned to per-1M wording
    Failure Indicators: either locale still shows 1K
    Evidence: .sisyphus/evidence/task-3-i18n-unit.png
  ```

  **Commit**: YES (can squash with Task 1)
  - Message: `fix(pricing): correct unit labels from 1K to 1M`

---

- [ ] 4. 详情页补齐缺失字段展示（成本、token 限制、interleaved）

  **What to do**:
  - 在 `ModelDetailSheet` 中条件展示：
    - `cost.reasoning`
    - `cost.input_audio`
    - `cost.output_audio`
    - `cost.context_over_200k`（可作为“Context > 200K Pricing”分组/行）
    - `limit.input`
  - `interleaved` 展示安全化：
    - `true` 显示“Supported”
    - object 显示具体 `field`
  - 增加必要 i18n key（en/zh）

  **Must NOT do**:
  - 不在卡片区塞入过多高级字段（保持卡片简洁）
  - 不对缺失字段显示误导性默认值（仅存在时展示）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 主要是信息层级与详情 UI 扩展
  - **Skills**: `["frontend-ui-ux"]`
    - `frontend-ui-ux`: 保持信息密度与可读性平衡
  - **Skills Evaluated but Omitted**:
    - `web-design-guidelines`: 当前是局部信息扩展，非整站审计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with 2, 5)
  - **Blocks**: 6
  - **Blocked By**: 1, 2, 3

  **References**:
  - `src/components/ModelDetailSheet.tsx:99-141` - interleaved/cost/limit 当前展示逻辑
  - `src/components/DetailRow.tsx:3-10` - 空值行隐藏行为
  - `src/i18n/locales/en.json` / `zh.json` - detail 字段文案区
  - `https://raw.githubusercontent.com/anomalyco/models.dev/dev/packages/core/src/schema.ts` - 字段合法值与可选性

  **Acceptance Criteria**:
  - [ ] 对含 `limit.input` 的模型，详情页出现 Max Input 行
  - [ ] 对含新增 cost 字段的模型，详情页出现对应成本行
  - [ ] `interleaved=true` 不再显示空 field，而是“Supported”语义
  - [ ] `interleaved={field:...}` 正确显示 `reasoning_content` 或 `reasoning_details`

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: limit.input and advanced cost fields are conditionally rendered
    Tool: Playwright + Bash(node pre-probe)
    Preconditions: Dev server running
    Steps:
      1. Run node pre-probe script to output one model id each with: limit.input, cost.reasoning, cost.input_audio
      2. For each sampled model id, search in UI and open detail sheet
      3. Assert corresponding DetailRow labels are visible with non-empty values
      4. Screenshot each case to .sisyphus/evidence/task-4-<field>.png
    Expected Result: Existing fields are rendered; missing fields remain hidden
    Failure Indicators: field exists in data but row missing; or missing field shows bogus default
    Evidence: .sisyphus/evidence/task-4-limit-input.png, task-4-cost-reasoning.png, task-4-cost-audio.png

  Scenario: interleaved both formats display correctly
    Tool: Playwright + Bash(node pre-probe)
    Preconditions: Dev server running
    Steps:
      1. Find one model with interleaved=true and one with interleaved.field
      2. Open detail for boolean model; assert interleaved row text contains "Supported"
      3. Open detail for object model; assert row shows exact field value
      4. Screenshot: .sisyphus/evidence/task-4-interleaved.png
    Expected Result: No blank interleaved output
    Failure Indicators: blank/null interleaved value shown
    Evidence: .sisyphus/evidence/task-4-interleaved.png
  ```

  **Commit**: YES
  - Message: `feat(detail): expose advanced model pricing and limits`

---

- [ ] 5. 状态字段可视化（alpha/beta/deprecated）

  **What to do**:
  - 在卡片与详情页增加状态 badge（仅当 `status` 存在）
  - `deprecated` 采用明显但不刺眼的弱警示样式
  - 补充中英文状态文案

  **Must NOT do**:
  - 本次不新增状态筛选器（避免范围膨胀）
  - 不对无 status 模型显示占位 badge

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 状态信息展示属于 UI 语义增强
  - **Skills**: `["frontend-ui-ux"]`
  - **Skills Evaluated but Omitted**:
    - `web-design-guidelines`: 可后续做整体审计

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 6
  - **Blocked By**: 1

  **References**:
  - `src/components/ModelCard.tsx` - 卡片元信息区域
  - `src/components/ModelDetailSheet.tsx` - 详情基本信息区域
  - `https://raw.githubusercontent.com/anomalyco/models.dev/dev/packages/core/src/schema.ts` - status 枚举定义

  **Acceptance Criteria**:
  - [ ] 至少一个 `deprecated` 模型显示状态 badge
  - [ ] 无 status 的模型不显示 badge
  - [ ] 中英文下状态文案正确

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Deprecated model status badge visible
    Tool: Playwright + Bash(node pre-probe)
    Preconditions: Dev server running
    Steps:
      1. Node pre-probe finds a model id with status="deprecated"
      2. Search and open that model in UI
      3. Assert badge text equals "Deprecated" (EN) / "已弃用" (ZH if translated)
      4. Screenshot: .sisyphus/evidence/task-5-deprecated-badge.png
    Expected Result: Deprecated status clearly visible
    Failure Indicators: missing badge or incorrect status text
    Evidence: .sisyphus/evidence/task-5-deprecated-badge.png

  Scenario: Models without status remain clean
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open a mainstream active model (e.g., GPT-4o)
      2. Assert no status badge is rendered
    Expected Result: No false-positive status labels
    Failure Indicators: default/empty badge rendered
    Evidence: .sisyphus/evidence/task-5-no-status.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add model lifecycle status badges`

---

- [ ] 6. 全链路回归与证据归档

  **What to do**:
  - 运行 lint/build
  - 执行关键端到端场景（单位、新增字段、provider override、status）
  - 整理 evidence 文件并记录结果

  **Must NOT do**:
  - 不跳过失败场景
  - 不提交无证据的“口头通过”

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及多模块集成回归与验收收口
  - **Skills**: `["pnpm"]`
    - `pnpm`: 统一脚本执行与依赖环境
  - **Skills Evaluated but Omitted**:
    - `vitest`: 当前项目无测试框架，本任务以 E2E + build 为主

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final)
  - **Blocks**: None
  - **Blocked By**: 2, 3, 4, 5

  **References**:
  - `package.json:6-11` - 可用脚本（lint/build/dev/preview）
  - `.sisyphus/evidence/` - QA 证据目录约定

  **Acceptance Criteria**:
  - [ ] `pnpm lint` → exit code 0
  - [ ] `pnpm build` → exit code 0
  - [ ] 所有任务定义的 evidence 文件存在且可打开
  - [ ] 验收记录中明确“单位已对齐 1M，数值未变”

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: Final build/lint gate
    Tool: Bash
    Preconditions: Dependencies installed
    Steps:
      1. Run: pnpm lint
      2. Assert: exit code 0
      3. Run: pnpm build
      4. Assert: exit code 0
      5. Save stdout/stderr logs
    Expected Result: Repository passes quality gates
    Failure Indicators: lint or build non-zero exit
    Evidence: .sisyphus/evidence/task-6-lint-build.txt

  Scenario: End-to-end smoke over critical fixes
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Verify pricing unit on card is /1M
      2. Verify detail label says per 1M
      3. Verify provider override sample shows expected npm
      4. Verify deprecated sample shows badge
      5. Capture summary screenshot
    Expected Result: All critical regressions resolved
    Failure Indicators: any critical assertion fails
    Evidence: .sisyphus/evidence/task-6-smoke-summary.png
  ```

  **Commit**: YES
  - Message: `chore(qa): validate schema alignment and pricing unit fixes`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 + 3 | `fix(schema): align types and pricing unit labels` | `src/types.ts`, `src/components/ModelCard.tsx`, `src/i18n/locales/*.json` | `pnpm build` |
| 2 + 4 + 5 | `feat(models): support provider override, advanced fields, and status badges` | `src/lib/utils.ts`, `src/components/ModelDetailSheet.tsx`, `src/components/ModelCard.tsx`, i18n files | `pnpm lint && pnpm build` |
| 6 | `chore(qa): capture evidence for schema parity` | `.sisyphus/evidence/*` (if committed by policy) | QA scenario replay |

---

## Success Criteria

### Verification Commands
```bash
pnpm lint       # Expected: no lint errors
pnpm build      # Expected: successful TypeScript + Vite build
```

### Final Checklist
- [ ] 全量价格单位口径统一为 per 1M（卡片、详情、i18n）
- [ ] 本地类型覆盖上游关键字段（status/provider/limit.input/advanced cost/interleaved union）
- [ ] provider override 模型信息展示正确
- [ ] deprecated 状态可见且无误报
- [ ] 高级字段仅在存在时展示，缺失字段不造成 UI 异常
- [ ] 构建与回归验证通过，证据完整
