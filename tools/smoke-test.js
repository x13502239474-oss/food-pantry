#!/usr/bin/env node
/* 饮食库 · 数据层冒烟测试（无需浏览器、无需第三方依赖）
 * 运行：node tools/smoke-test.js
 * 覆盖验收：临期优先 / 做菜扣库存 / 采购清空 / JSON+CSV 导出再导入恢复
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const mem = Object.create(null);
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; }
};
globalThis.window = globalThis;

for (const f of ['js/recipe-book.js', 'js/seed.js', 'js/store.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });
}
const S = globalThis.FP.Store;
const results = [];
function check(name, fn) { fn(); results.push(name); console.log('  PASS  ' + name); }

console.log('饮食库 · 数据层验收\n');

let db = S.load();
check('首次运行生成示例假数据', () => {
  const c = S.counts(db);
  assert.ok(c.ingredients >= 50, '食材数量不足：' + c.ingredients);
  assert.ok(c.recipes >= 40, '菜谱数量不足：' + c.recipes);
  assert.ok(c.shoppingItems >= 5 && c.cookLogs >= 3 && c.leftovers >= 2);
  assert.strictEqual(db.meta.note, '示例假数据');
  assert.strictEqual(db.meta.recipeFocus, '湘菜 + 家常菜');
  assert.strictEqual(db.meta.recipeBookVersion, S.bookVersion());
});

check('湘菜 / 家常菜各不少于 20 道，食材引用完整', () => {
  const xiang = db.recipes.filter((r) => r.tags.includes('湘菜'));
  const jia = db.recipes.filter((r) => r.tags.includes('家常'));
  const focused = db.recipes.filter((r) => S.preferredTagsOf(r.tags).length > 0);
  assert.ok(xiang.length >= 20, '湘菜数量不足：' + xiang.length);
  assert.ok(jia.length >= 20, '家常菜数量不足：' + jia.length);
  assert.ok(focused.length / db.recipes.length >= 0.9, '湘菜/家常菜占比不足');
  const ids = new Set(db.ingredients.map((i) => i.id));
  db.recipes.forEach((r) => r.ingredients.forEach((ri) => {
    assert.ok(ids.has(ri.ingredientId), r.title + ' 引用了不存在的食材：' + ri.ingredientId);
  }));
  console.log('        共 ' + db.recipes.length + ' 道：湘菜 ' + xiang.length + ' · 家常 ' + jia.length + ' · 偏好占比 ' + Math.round(focused.length / db.recipes.length * 100) + '%');
});

const today = S.todayStr();
const exp = S.expiringIngredients(db, today);
check('临期食材被正确识别并排序', () => {
  assert.ok(exp.length >= 4, '临期食材示例不足');
  exp.forEach((i) => {
    const l = S.expiryLevel(i, today, db.meta.expiryWindowDays);
    assert.ok(l === 'soon' || l === 'expired', i.name + ' 不应被判为临期');
  });
  for (let k = 1; k < exp.length; k++) {
    assert.ok(S.daysUntil(exp[k - 1].expiresAt, today) <= S.daysUntil(exp[k].expiresAt, today));
  }
});

const recs = S.recommend(db, today, 3);
check('「今天吃什么」临期食材优先', () => {
  assert.strictEqual(recs.length, 3);
  assert.ok(recs[0].soonCount >= 1, '推荐第一名必须用到临期食材');
  const withSoon = recs.filter((r) => r.soonCount > 0).length;
  assert.ok(withSoon >= 2, '推荐列表应主要由临期食材驱动');
  console.log('        Top3：' + recs.map((r) => r.title + '(' + r.score + '分/临期' + r.soonCount + '/' + (r.preferredTags.join('·') || '无偏好') + ')').join(' > '));
});

check('湘菜 / 家常菜优先，但不覆盖临期规则', () => {
  assert.ok(S.tagBoost(['湘菜', '家常']) > 0, '偏好标签应有加分');
  assert.ok(S.tagBoost(['湘菜', '家常']) < 100, '标签加分必须小于「临期食材 +100/样」，否则会破坏临期优先');
  assert.ok(recs.every((r) => r.preferredTags.length > 0), '推荐 Top3 应优先出现湘菜 / 家常菜');
  assert.ok(recs.some((r) => r.preferredTags.includes('湘菜')), '推荐 Top3 应包含湘菜');
  // 同样条件下，带偏好标签的菜分数应更高
  const plain = S.clone(db);
  const target = plain.recipes.find((r) => r.tags.includes('湘菜'));
  const before = S.recommend(plain, today, plain.recipes.length).find((r) => r.recipeId === target.id).score;
  target.tags = target.tags.filter((t) => t !== '湘菜' && t !== '家常');
  const after = S.recommend(plain, today, plain.recipes.length).find((r) => r.recipeId === target.id).score;
  assert.ok(before > after, '去掉湘菜/家常标签后分数应下降');
});

check('做一道菜按用量扣库存并生成记录', () => {
  const plan = S.planCook(db, recs[0].recipeId, 2, today);
  assert.ok(plan.items.length > 0);
  const before = Object.fromEntries(db.ingredients.map((i) => [i.id, i.quantity]));
  const res = S.applyCook(db, plan, { note: '冒烟测试' });
  assert.ok(res.changes.length > 0, '至少应扣掉一种食材');
  res.changes.forEach((c) => {
    assert.ok(Math.abs(res.db.ingredients.find((i) => i.id === c.ingredientId).quantity - (before[c.ingredientId] - c.delta)) < 0.001);
  });
  assert.ok(res.db.ingredients.every((i) => i.quantity >= 0), '库存不能为负');
  assert.strictEqual(res.db.cookLogs.length, db.cookLogs.length + 1);
  assert.ok(res.db.recipes.find((r) => r.id === plan.recipeId).lastCookedAt);
  assert.strictEqual(res.log.deductions.length, res.changes.length);
  db = S.save(res.db);
});

check('扣库存允许手动修正（把某项改为 0）', () => {
  const plan = S.planCook(db, 'r_tomato_egg', 2, today);
  const target = plan.items.find((x) => x.plannedDeduct > 0);
  assert.ok(target, '需要有可扣除的食材');
  const beforeQty = db.ingredients.find((i) => i.id === target.ingredientId).quantity;
  const deductions = {};
  plan.items.forEach((x) => { deductions[x.ingredientId] = x.plannedDeduct; });
  deductions[target.ingredientId] = 0;
  const res = S.applyCook(db, plan, { deductions });
  assert.strictEqual(res.db.ingredients.find((i) => i.id === target.ingredientId).quantity, beforeQty);
});

check('缺料提示 + 缺料一键进采购清单', () => {
  const plan = S.planCook(db, 'r_cheese_toast', 2, today);
  assert.ok(plan.missing.some((x) => x.name === '吐司'), '吐司库存为 0，应提示缺料');
  const res = S.addMissingToShopping(db, 'r_cheese_toast', 2, today);
  assert.ok(res.db.shoppingItems.length > db.shoppingItems.length);
  assert.ok(res.db.shoppingItems.some((s) => s.source.indexOf('缺料:') === 0));
});

check('剩菜到期提醒可识别', () => {
  const alerts = S.leftoverAlerts(db, today);
  assert.ok(alerts.length >= 2, '应有今天/明天到期与已过期的示例剩菜');
  assert.ok(alerts.some((l) => S.daysUntil(l.expiresAt, today) <= 0));
});

const doneCount = db.shoppingItems.filter((s) => s.done).length;
check('采购清单可清空已完成并可撤销', () => {
  assert.ok(doneCount >= 1, '示例里应有已完成项');
  const cleared = S.clearDoneShopping(db);
  assert.strictEqual(cleared.removed.length, doneCount);
  assert.ok(cleared.db.shoppingItems.every((s) => !s.done));
  const restored = S.restoreShopping(cleared.db, cleared.removed);
  assert.strictEqual(restored.shoppingItems.length, db.shoppingItems.length);
});

check('JSON 导出 → 修改 → 重新导入可完整恢复', () => {
  const snapshot = S.exportJSON(db);
  const parsed = JSON.parse(snapshot);
  assert.strictEqual(parsed.format, 'foodpantry-full');
  assert.ok(parsed.exportedAt);
  const tampered = S.clone(db);
  tampered.ingredients[0].quantity = 999;
  tampered.shoppingItems = [];
  tampered.recipes = tampered.recipes.slice(0, 1);
  const imported = S.importJSON(snapshot);
  assert.deepStrictEqual(S.counts(imported.db), S.counts(db));
  assert.strictEqual(imported.db.ingredients[0].quantity, db.ingredients[0].quantity);
  assert.strictEqual(imported.db.shoppingItems.length, db.shoppingItems.length);
  assert.throws(() => S.importJSON('{bad json'), /JSON/);
});

check('CSV 导出 → 重新导入（全部 7 张表）各表条数一致', () => {
  S.TABLES.forEach((table) => {
    const csv = S.toCSV(db, table);
    assert.ok(csv.charCodeAt(0) === 0xFEFF, table + ' CSV 应带 UTF-8 BOM');
    const back = S.fromCSV(db, table, csv, 'replace');
    assert.strictEqual(back.db[table].length, db[table].length, table + ' 条数不一致');
    if (table === 'recipes') {
      assert.ok(Array.isArray(back.db.recipes[0].ingredients) && Array.isArray(back.db.recipes[0].steps));
      assert.ok(Array.isArray(back.db.recipes[0].tags));
    }
    if (table === 'shoppingItems') {
      assert.strictEqual(typeof back.db.shoppingItems[0].done, 'boolean');
    }
    if (table === 'ingredients') {
      assert.strictEqual(back.db.ingredients[0].quantity, db.ingredients[0].quantity);
    }
  });
  const appended = S.fromCSV(db, 'shoppingItems', S.toCSV(db, 'shoppingItems'), 'append');
  assert.strictEqual(appended.db.shoppingItems.length, db.shoppingItems.length * 2);
});

check('导入前备份 / 低库存补货', () => {
  S.backup(db);
  const bk = S.readBackup();
  assert.deepStrictEqual(S.counts(bk), S.counts(db));
  const low = S.addLowStockToShopping(db);
  assert.ok(low.added >= 1);
});

check('菜谱库导出 → 编辑 → 再导入，可批量更新菜谱且不碰业务数据', () => {
  const before = S.clone(db);
  const bookText = S.exportRecipeBook(db);
  const book = S.parseRecipeBook(bookText);
  assert.ok(book.recipes.length >= 40);
  assert.ok(book.recipes[0].ingredients[0].name, '导出的食材应是名称而不是 id');
  // 模拟用户手工改菜谱：改标题、加一道用「新食材名」的菜
  book.recipes[0].title = '我改过的辣椒炒肉';
  book.recipes.push({
    id:'r_user_new', title:'测试新菜', servings:2, tags:['家常','快手'], lastCookedDays:null,
    ingredients:[{name:'从未见过的新食材',quantity:2,unit:'个'},{name:'鸡蛋',quantity:2,unit:'个'}],
    steps:['随便炒一下']
  });
  book.version = S.bookVersion() + 1;
  const applied = S.applyRecipeBook(db, book, today);
  assert.strictEqual(applied.recipes.length, db.recipes.length + 1);
  assert.ok(applied.recipes.some((r) => r.title === '我改过的辣椒炒肉'));
  assert.ok(applied.recipes.some((r) => r.id === 'r_user_new'));
  assert.ok(applied.ingredients.some((i) => i.name === '从未见过的新食材'), '新食材应自动补建');
  // 库存 / 采购 / 记录 / 剩菜完全不动
  assert.deepStrictEqual(applied.ingredients.filter((i) => i.id === 'ing_tomato')[0].quantity,
                         before.ingredients.filter((i) => i.id === 'ing_tomato')[0].quantity);
  assert.deepStrictEqual(applied.shoppingItems, before.shoppingItems);
  assert.deepStrictEqual(applied.cookLogs, before.cookLogs);
  assert.deepStrictEqual(applied.leftovers, before.leftovers);
  assert.throws(() => S.parseRecipeBook('{"foo":1}'), /菜谱库/);
});

check('菜谱书版本提升后增量更新：保留库存、自建食材、自建菜谱与做饭记录', () => {
  const legacy = S.clone(S.createSeed('2026-01-01'));
  legacy.meta.seedVersion = 1;
  legacy.meta.recipeBookVersion = 1;
  legacy.recipes = legacy.recipes.slice(0, 3);
  legacy.ingredients.find((i) => i.id === 'ing_tomato').quantity = 42;
  legacy.recipes[0].custom = true;
  legacy.recipes[0].title = '我不希望被覆盖的菜';
  legacy.ingredients.push({
    id:'ing_my_own', name:'我自己加的食材', category:'未分类', unit:'袋', quantity:7,
    expiresAt:null, location:'常温', note:'', createdAt:null, updatedAt:null
  });
  mem[S.STORAGE_KEY] = JSON.stringify(legacy);
  delete mem[S.BACKUP_KEY];
  const upgraded = S.load();
  assert.strictEqual(upgraded.meta.seedVersion, S.SEED_VERSION);
  assert.strictEqual(upgraded.meta.recipeBookVersion, S.bookVersion());
  assert.ok(upgraded.recipes.length >= 40, '应换成完整菜谱书');
  assert.ok(upgraded.recipes.some((r) => r.title === '我不希望被覆盖的菜'), '自建菜谱必须保留');
  assert.strictEqual(upgraded.recipes.filter((r) => r.title === '我不希望被覆盖的菜').length, 1, '不能重复');
  assert.strictEqual(upgraded.ingredients.find((i) => i.id === 'ing_tomato').quantity, 42, '库存数量必须保留');
  assert.ok(upgraded.ingredients.some((i) => i.id === 'ing_my_own'), '自建食材必须保留');
  assert.strictEqual(upgraded.cookLogs.length, legacy.cookLogs.length);
  assert.strictEqual(upgraded.meta.recipeBookUpgradedFrom, 1);
  assert.ok(mem[S.BACKUP_KEY], '旧数据必须自动备份');
  const oldAgain = S.readBackup();
  assert.strictEqual(oldAgain.recipes.length, 3, '回滚应能拿回旧数据');
  assert.strictEqual(oldAgain.meta.seedVersion, S.SEED_VERSION, '回滚数据不能再被自动升级覆盖');
  assert.strictEqual(oldAgain.meta.recipeBookVersion, S.bookVersion());
});

console.log('\n全部通过：' + results.length + ' 项。当前数据均为示例假数据，未写入任何真实家庭信息。');
