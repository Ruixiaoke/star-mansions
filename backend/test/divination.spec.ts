/**
 * /api/divination 后端单测（六爻 PRD §11/§12/§14；验收 §16 第 28–33 条）。
 * 本环境未配置 SUPABASE_URL / SUPABASE_SECRET_KEY —— 全部用例走内存回落分支（§16-31）。
 * ⚠️ 真库分支（.eq("user_id", auth) 那一半）本文件**不能**验证，见各用例注释里的「未验证」标注。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  handleDivinationList,
  handleDivinationSave,
  handleDivinationDelete,
} from "../src/handlers/divination";
import { getDb } from "../src/lib/db";
import divinationApiHandler from "../api/divination";

// 每个用例用独立 token 分区 memStore（模块级单例，用例间不清空，见交接消息「隔离」提示）。
let userSeq = 0;
function freshUser(prefix = "u"): string {
  userSeq += 1;
  return `${prefix}-${userSeq}-${Date.now()}`;
}

// 一个「形状真实」的卦例快照（对应卦码 "987678"，§5.5 / §16-7）。
function samplePayload() {
  return {
    tosses: [
      { index: 1, coins: ["back", "back", "back"], value: 9 },
      { index: 2, coins: ["back", "back", "char"], value: 8 },
      { index: 3, coins: ["back", "char", "char"], value: 7 },
      { index: 4, coins: ["char", "char", "char"], value: 6 },
      { index: 5, coins: ["back", "char", "char"], value: 7 },
      { index: 6, coins: ["back", "back", "char"], value: 8 },
    ],
    yaos: [
      { position: 1, value: 9, yin_yang: "yang", moving: true },
      { position: 2, value: 8, yin_yang: "yin", moving: false },
      { position: 3, value: 7, yin_yang: "yang", moving: false },
      { position: 4, value: 6, yin_yang: "yin", moving: true },
      { position: 5, value: 7, yin_yang: "yang", moving: false },
      { position: 6, value: 8, yin_yang: "yin", moving: false },
    ],
    primaryOrder: 1,
    changedOrder: 44,
    movingPositions: [1, 4],
  };
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    kind: "liuyao",
    topic: "career",
    code: "987678",
    payload: samplePayload(),
    ...overrides,
  };
}

describe("环境前提：未配置 Supabase env（§16-31 的前置条件）", () => {
  it("getDb() 为 null —— 本文件全部用例确实走内存回落分支，不是误连真库", () => {
    expect(getDb()).toBeNull();
  });
});

// 「未登录不发写请求」本身是前端职责，后端能验证的只是「即使发了也挡住」——
// 下面三条（GET/POST/DELETE 全 401）就是这一点的完整证据，故不再单列说明性用例。
describe("§16-30 / §16-28：无 Authorization → 401（GET / POST / DELETE 三个方法）", () => {
  it("GET 无 auth → 401 UNAUTHORIZED", async () => {
    const r = await handleDivinationList(null);
    expect(r.status).toBe(401);
    expect(r.body).toEqual({ error: "UNAUTHORIZED", message: "请先登录" });
  });

  it("POST 无 auth → 401（即使 body 合法也不建库）", async () => {
    const r = await handleDivinationSave(null, validBody());
    expect(r.status).toBe(401);
    expect((r.body as { error: string }).error).toBe("UNAUTHORIZED");
  });

  it("DELETE 无 auth → 401", async () => {
    const r = await handleDivinationDelete(null, "any-id");
    expect(r.status).toBe(401);
    expect((r.body as { error: string }).error).toBe("UNAUTHORIZED");
  });
});

describe("§16-29：保存 → 回看 → 删除全链路；删除只能删本人", () => {
  it("保存后能在自己的列表里看到", async () => {
    const user = freshUser();
    const saved = await handleDivinationSave(user, validBody({ topic: "wealth" }));
    expect(saved.status).toBe(200);
    const divination = (saved.body as { divination: { id: string; topic: string } }).divination;
    expect(divination.topic).toBe("wealth");

    const listed = await handleDivinationList(user);
    expect(listed.status).toBe(200);
    const divinations = (listed.body as { divinations: Array<{ id: string }> }).divinations;
    expect(divinations.map((d) => d.id)).toContain(divination.id);
  });

  it("跨用户删除不影响他人数据（用另一 token 删 → 原用户记录仍在）", async () => {
    const owner = freshUser("owner");
    const intruder = freshUser("intruder");

    const saved = await handleDivinationSave(owner, validBody());
    const id = (saved.body as { divination: { id: string } }).divination.id;

    // 用 intruder 的 token 去删 owner 的记录
    const del = await handleDivinationDelete(intruder, id);
    // 内存分支的设计：删不到就静默 ok:true（不暴露他人记录是否存在），不是把它当报错——
    // 但关键断言是下面这条：owner 的数据必须原封不动。
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ ok: true });

    const ownerList = await handleDivinationList(owner);
    const ids = (ownerList.body as { divinations: Array<{ id: string }> }).divinations.map((d) => d.id);
    expect(ids).toContain(id); // 仍在——没被 intruder 删掉

    // intruder 自己的列表应为空，证明两者数据确实隔离
    const intruderList = await handleDivinationList(intruder);
    expect((intruderList.body as { divinations: unknown[] }).divinations).toEqual([]);
  });

  it("本人删除自己的记录 → 生效，列表里不再出现", async () => {
    const user = freshUser();
    const saved = await handleDivinationSave(user, validBody());
    const id = (saved.body as { divination: { id: string } }).divination.id;

    const del = await handleDivinationDelete(user, id);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ ok: true });

    const list = await handleDivinationList(user);
    const ids = (list.body as { divinations: Array<{ id: string }> }).divinations.map((d) => d.id);
    expect(ids).not.toContain(id);
  });

  it("列表按插入序倒序返回（内存分支的确定性排序；⚠️ 真库分支是 created_at desc，同毫秒不保证同序，不可照搬这条断言）", async () => {
    const user = freshUser();
    const first = await handleDivinationSave(user, validBody({ topic: "career" }));
    const second = await handleDivinationSave(user, validBody({ topic: "relationship" }));
    const firstId = (first.body as { divination: { id: string } }).divination.id;
    const secondId = (second.body as { divination: { id: string } }).divination.id;

    const list = await handleDivinationList(user);
    const ids = (list.body as { divinations: Array<{ id: string }> }).divinations.map((d) => d.id);
    expect(ids[0]).toBe(secondId); // 最后插入的排最前
    expect(ids[1]).toBe(firstId);
  });

  it("卦码 + payload 往返一致（含数组结构，模拟 §16-7「卦码可还原整卦」的存取半段）", async () => {
    const user = freshUser();
    const payload = samplePayload();
    // 显式过一遍 JSON 序列化/反序列化，模拟这份数据经过 HTTP body 传输后的真实形状
    // （浏览器 fetch 发出时早已 JSON.stringify 过；这里只是把这一步摆在测试里做，而不是假装它没发生）。
    const overWire = JSON.parse(JSON.stringify(payload));

    const saved = await handleDivinationSave(user, validBody({ code: "987678", payload: overWire }));
    const divination = (saved.body as { divination: { id: string; code: string; payload: unknown } }).divination;
    expect(divination.code).toBe("987678");
    expect(divination.payload).toEqual(overWire);

    const list = await handleDivinationList(user);
    const found = (list.body as { divinations: Array<{ id: string; payload: unknown }> }).divinations.find(
      (d) => d.id === divination.id,
    );
    expect(found?.payload).toEqual(overWire);
    // ⚠️ 未验证：真实 Supabase jsonb 往返（key 顺序不保证、undefined 会被吞掉）。
    // 内存分支按引用保存对象，不经过任何序列化层，这条测试证明不了 DB 分支的 jsonb 行为，
    // 本环境无 Supabase 凭据，无法补测——如实标注，不假装验过。
  });
});

describe("§16-31：未配 Supabase env 时回落内存 mock，不崩", () => {
  it("save/list/delete 全部走通且不抛异常（本组所有用例本身就是证据；这里额外断言一次完整调用不 throw）", async () => {
    const user = freshUser();
    await expect(handleDivinationSave(user, validBody())).resolves.toBeTruthy();
    await expect(handleDivinationList(user)).resolves.toBeTruthy();
    await expect(handleDivinationDelete(user, "nonexistent-id")).resolves.toEqual({
      status: 200,
      body: { ok: true },
    }); // 删不存在的 id：内存分支静默通过，不报错、不崩
  });
});

describe("PRD §11 补测：字段校验（POST 请求体）", () => {
  it("缺 kind → 400", async () => {
    const { kind: _kind, ...rest } = validBody();
    const r = await handleDivinationSave(freshUser(), rest);
    expect(r.status).toBe(400);
    expect((r.body as { error: string }).error).toBe("INVALID_INPUT");
  });

  it("缺 topic → 400", async () => {
    const { topic: _topic, ...rest } = validBody();
    const r = await handleDivinationSave(freshUser(), rest);
    expect(r.status).toBe(400);
  });

  it("缺 code → 400", async () => {
    const { code: _code, ...rest } = validBody();
    const r = await handleDivinationSave(freshUser(), rest);
    expect(r.status).toBe(400);
  });

  it("缺 payload → 400", async () => {
    const { payload: _payload, ...rest } = validBody();
    const r = await handleDivinationSave(freshUser(), rest);
    expect(r.status).toBe(400);
  });

  it("payload 显式传 null → 400（等同缺失，契约 §11 明文）", async () => {
    const r = await handleDivinationSave(freshUser(), validBody({ payload: null }));
    expect(r.status).toBe(400);
  });

  it('kind 非 "liuyao" → 400（新加的运行时校验，与 DivinationKind 字面量类型对齐）', async () => {
    const r = await handleDivinationSave(freshUser(), validBody({ kind: "tarot" }));
    expect(r.status).toBe(400);
    expect((r.body as { error: string; message: string }).message).toBe('本期 kind 只接受 "liuyao"');
  });

  it("8 个合法 topic（Tier A 五命 + Tier B 三项）全部能保存成功", async () => {
    const legal = ["mou", "yu", "guo", "zhi", "zheng", "career", "wealth", "relationship"];
    for (const topic of legal) {
      const r = await handleDivinationSave(freshUser(), validBody({ topic }));
      expect(r.status).toBe(200);
      expect((r.body as { divination: { topic: string } }).divination.topic).toBe(topic);
    }
  });

  it("非法 topic（枚举外的自由文本）→ 400，且响应体不回显收到的值（PRD §14 隐私：拒绝信息本身不能泄露被拒的敏感内容）", async () => {
    const freeTextAttempt = "我想问问要不要跟他离婚";
    const r = await handleDivinationSave(freshUser(), validBody({ topic: freeTextAttempt }));
    expect(r.status).toBe(400);
    const body = r.body as { error: string; message: string };
    expect(body.error).toBe("INVALID_INPUT");
    expect(body.message).not.toContain(freeTextAttempt); // 不回显——这是本条的核心断言
    expect(body.message).toContain("career"); // 只列合法值
  });

  it("请求体不是对象（字符串）→ 400", async () => {
    const r = await handleDivinationSave(freshUser(), "not-an-object");
    expect(r.status).toBe(400);
  });

  it("请求体为 null → 400", async () => {
    const r = await handleDivinationSave(freshUser(), null);
    expect(r.status).toBe(400);
  });
});

describe("PRD §11 补测：GET ?kind= 过滤（内存分支）", () => {
  it('?kind=liuyao 能查到；?kind=不存在的值 返回空数组（不是报错）——⚠️ 仅验证内存分支的过滤逻辑，DB 分支的条件式 query.eq("kind", kind) 拼接本环境未连真库、未验证', async () => {
    const user = freshUser();
    await handleDivinationSave(user, validBody());

    const liuyao = await handleDivinationList(user, "liuyao");
    expect(liuyao.status).toBe(200);
    expect((liuyao.body as { divinations: unknown[] }).divinations.length).toBe(1);

    const other = await handleDivinationList(user, "tarot");
    expect(other.status).toBe(200);
    expect((other.body as { divinations: unknown[] }).divinations).toEqual([]);
  });

  it("不传 kind → 返回该用户全部记录", async () => {
    const user = freshUser();
    await handleDivinationSave(user, validBody());
    const all = await handleDivinationList(user);
    expect((all.body as { divinations: unknown[] }).divinations.length).toBe(1);
  });
});

describe("六爻 PRD §14 隐私：handler 不打印 topic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("源码里没有任何 console.* 调用（静态检查）", () => {
    const src = readFileSync(join(__dirname, "../src/handlers/divination.ts"), "utf-8");
    expect(src).not.toMatch(/console\./);
  });

  it("完整 save→list→delete 一轮下来，console.log/warn/error/info 一次都没被调用（运行时检查，标记值放在 payload 里做双层验证）", async () => {
    // topic 现在是枚举（8 值之一），不能再拿它当「易识别标记」用（会被 400 挡掉）——
    // 标记改放进 payload（那一栏没有枚举约束），双层验证：① spy 零调用 ② 万一将来有调用，参数也不含标记。
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const user = freshUser();
    const marker = "PRIVACY_MARKER_should_never_be_logged";
    const saved = await handleDivinationSave(
      user,
      validBody({ topic: "relationship", payload: { ...samplePayload(), marker } }),
    );
    const id = (saved.body as { divination: { id: string } }).divination.id;
    await handleDivinationList(user);
    await handleDivinationDelete(user, id);

    for (const spy of [logSpy, warnSpy, errorSpy, infoSpy]) {
      expect(spy).not.toHaveBeenCalled(); // 主断言：一次都没调用
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(marker); // 第二层：即使调用了也不含标记
      }
    }
  });
});

describe("代码扫描：无无前缀的 isOldYang（§5.3 陷阱，虽属引擎范畴，但顺手核对本文件涉及的后端代码没有这个坑）", () => {
  it("handlers/divination.ts 与 api/divination.ts 都不含裸 isOldYang 标识符", () => {
    const files = [
      join(__dirname, "../src/handlers/divination.ts"),
      join(__dirname, "../api/divination.ts"),
    ];
    for (const f of files) {
      const src = readFileSync(f, "utf-8");
      expect(src).not.toMatch(/\bisOldYang\b/);
    }
  });
});

// ---------------------------------------------------------------------------
// api/divination.ts —— Vercel serverless 入口（薄封装：方法路由 + CORS + bearer 解析）
// 用最小 mock req/res 验证分发逻辑本身（不重复测 handlers 层已覆盖的业务逻辑）。
// ---------------------------------------------------------------------------

function makeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    jsonBody: undefined as unknown,
    ended: false,
    setHeader(k: string, v: string) {
      res.headers[k] = v;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.jsonBody = body;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
  };
  return res;
}

function makeReq(opts: {
  method: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
}) {
  return {
    method: opts.method,
    headers: opts.headers ?? {},
    query: opts.query ?? {},
    body: opts.body,
  };
}

describe("api/divination.ts —— 方法路由 + CORS + bearer 解析", () => {
  it("OPTIONS → 204 直接结束，不触发业务逻辑（预检）", async () => {
    const req = makeReq({ method: "OPTIONS" });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
    expect(res.jsonBody).toBeUndefined();
    expect(res.headers["Access-Control-Allow-Origin"]).toBeTruthy();
  });

  it("GET 无 Authorization → 401", async () => {
    const req = makeReq({ method: "GET" });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(401);
  });

  it('GET 带 "Bearer <token>"（大写 B）→ 走通并透传 ?kind=', async () => {
    const user = freshUser("wire");
    await handleDivinationSave(user, validBody());
    const req = makeReq({
      method: "GET",
      headers: { authorization: `Bearer ${user}` },
      query: { kind: "liuyao" },
    });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect((res.jsonBody as { divinations: unknown[] }).divinations.length).toBe(1);
  });

  it('GET 带小写 "bearer <token>" 也能解析（正则大小写不敏感）', async () => {
    const user = freshUser("wire-lower");
    const req = makeReq({ method: "GET", headers: { authorization: `bearer ${user}` } });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200); // 未登录 401 都没触发，说明 token 被正确解析出来了
  });

  it("POST 无 Authorization → 401，且不落库", async () => {
    const req = makeReq({ method: "POST", body: validBody() });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(401);
  });

  it("POST 带 Authorization + 合法 body → 200 并返回 divination", async () => {
    const user = freshUser("wire-post");
    const req = makeReq({
      method: "POST",
      headers: { authorization: `Bearer ${user}` },
      body: validBody(),
    });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect((res.jsonBody as { divination: { userId: string } }).divination.userId).toBe(user);
  });

  it("DELETE 缺 id → 400（透传 handler 的校验）", async () => {
    const user = freshUser("wire-del");
    const req = makeReq({ method: "DELETE", headers: { authorization: `Bearer ${user}` } });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(400);
  });

  it("不支持的方法（如 PATCH）→ 405", async () => {
    const req = makeReq({ method: "PATCH" });
    const res = makeRes();
    await divinationApiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    expect(res.statusCode).toBe(405);
    expect((res.jsonBody as { error: string }).error).toBe("METHOD_NOT_ALLOWED");
  });
});
