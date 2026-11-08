/* 饮食库 · 数据层
 * - 单文档快照存 localStorage，键 foodpantry.db.v1
 * - 全部业务逻辑本地计算，无网络请求、无后端
 * - 所有写操作返回新的 db 对象（便于撤销 / 回滚）
 */
(function (global) {
  'use strict';
  var FP = global.FP = global.FP || {};
  var Seed = FP.Seed;

  var STORAGE_KEY = 'foodpantry.db.v1';
  var BACKUP_KEY = 'foodpantry.db.backup.v1';
  var SCHEMA_VERSION = 1;
  var SEED_VERSION = 3; // 初始示例数据版本；菜谱单独由 RecipeBook.version 控制增量更新
  var TABLES = ['categories', 'units', 'ingredients', 'recipes', 'cookLogs', 'shoppingItems', 'leftovers'];
  var PREFIX = { categories:'cat', units:'u', ingredients:'ing', recipes:'r', cookLogs:'cl', shoppingItems:'sh', leftovers:'lf' };

  /* 菜谱取向：湘菜 / 家常菜优先。
   * 加权值刻意远小于「临期食材 +100/样」，保证临期优先这条硬规则不被覆盖。 */
  var PREFERRED_TAGS = [
    { name: '湘菜', boost: 30 },
    { name: '家常', boost: 18 }
  ];

  var CSV_TABLES = {
    categories:    { label:'分类',     columns:['id','name','sortOrder'], numFields:['sortOrder'], jsonFields:[], joinFields:[], boolFields:[] },
    units:         { label:'单位',     columns:['id','name','sortOrder'], numFields:['sortOrder'], jsonFields:[], joinFields:[], boolFields:[] },
    ingredients:   { label:'食材库存', columns:['id','name','category','unit','quantity','expiresAt','location','note','createdAt','updatedAt'], numFields:['quantity'], jsonFields:[], joinFields:[], boolFields:[] },
    recipes:       { label:'菜谱',     columns:['id','title','servings','tags','ingredients','steps','lastCookedAt','createdAt'], numFields:['servings'], jsonFields:['ingredients','steps'], joinFields:['tags'], boolFields:[] },
    cookLogs:      { label:'做饭记录', columns:['id','recipeId','cookedAt','servings','note','deductions'], numFields:['servings'], jsonFields:['deductions'], joinFields:[], boolFields:[] },
    shoppingItems: { label:'采购清单', columns:['id','name','quantity','unit','done','source','createdAt'], numFields:['quantity'], jsonFields:[], joinFields:[], boolFields:['done'] },
    leftovers:     { label:'剩菜',     columns:['id','recipeId','cookedAt','expiresAt','note','status'], numFields:[], jsonFields:[], joinFields:[], boolFields:[] }
  };

  /* ---------------- 基础工具 ---------------- */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayStr(d) { return ymd(d || new Date()); }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function findById(arr, id) {
    for (var i = 0; i < (arr || []).length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function parseDay(s) {
    if (s == null || s === '') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }
  function daysUntil(dateStr, today) {
    var a = parseDay(dateStr), b = parseDay(today || todayStr());
    if (!a || !b) return null;
    return Math.round((a.getTime() - b.getTime()) / 86400000);
  }
  function addDaysToISO(iso, n) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    d.setDate(d.getDate() + Number(n || 0));
    return d.toISOString();
  }
  function expiryLevel(ing, today, windowDays) {
    var win = windowDays == null ? 3 : Number(windowDays);
    if (!ing || !ing.expiresAt) return 'none';
    var d = daysUntil(ing.expiresAt, today);
    if (d === null) return 'none';
    if (d < 0) return 'expired';
    if (d <= win) return 'soon';
    if (d <= win + 4) return 'watch';
    return 'ok';
  }

  /* ---------------- 结构规范化（导入容错） ---------------- */
  function normalize(db) {
    var out = clone(db || {});
    out.schemaVersion = SCHEMA_VERSION;
    out.app = out.app || '饮食库';
    out.format = 'foodpantry-full';
    var defaults = {
      createdAt: new Date().toISOString(), expiryWindowDays: 3, defaultServings: 2,
      leftoverDays: 3, lowStockThreshold: 1, theme: 'light',
      recipeFocus: '湘菜 + 家常菜', seedVersion: 1, recipeBookVersion: 1, note: ''
    };
    var m = Object.assign({}, defaults, out.meta || {});
    ['expiryWindowDays', 'defaultServings', 'leftoverDays', 'lowStockThreshold'].forEach(function (k) {
      m[k] = Number(m[k]) || defaults[k];
    });
    m.seedVersion = Number(m.seedVersion) || 1;         // 旧数据没有该字段，视为 v1
    m.recipeBookVersion = Number(m.recipeBookVersion) || 1;
    out.meta = m;

    TABLES.forEach(function (t) { if (!Array.isArray(out[t])) out[t] = []; });

    out.categories = out.categories.map(function (x, i) {
      return { id:String(x.id || uid(PREFIX.categories)), name:String(x.name || '未命名'), sortOrder:Number(x.sortOrder) || (i + 1) };
    });
    out.units = out.units.map(function (x, i) {
      return { id:String(x.id || uid(PREFIX.units)), name:String(x.name || '未命名'), sortOrder:Number(x.sortOrder) || (i + 1) };
    });
    out.ingredients = out.ingredients.map(function (x) {
      return {
        id:String(x.id || uid(PREFIX.ingredients)), name:String(x.name || '未命名食材'),
        category:String(x.category || '未分类'), unit:String(x.unit || ''),
        quantity:round2(x.quantity), expiresAt:x.expiresAt || null,
        location:String(x.location || ''), note:String(x.note || ''),
        createdAt:x.createdAt || null, updatedAt:x.updatedAt || null
      };
    });
    out.recipes = out.recipes.map(function (x) {
      var ings = Array.isArray(x.ingredients) ? x.ingredients : [];
      var steps = Array.isArray(x.steps) ? x.steps.map(String)
                : (x.steps ? String(x.steps).split('\n').map(function (s) { return s.trim(); }).filter(Boolean) : []);
      var tags = Array.isArray(x.tags) ? x.tags.map(String)
                : (x.tags ? String(x.tags).split(/[|,，]/).map(function (s) { return s.trim(); }).filter(Boolean) : []);
      return {
        id:String(x.id || uid(PREFIX.recipes)), title:String(x.title || '未命名菜谱'),
        servings:Number(x.servings) || 2,
        ingredients:ings.map(function (ri) {
          return { ingredientId:String(ri.ingredientId || ''), quantity:round2(ri.quantity), unit:String(ri.unit || '') };
        }).filter(function (ri) { return ri.ingredientId; }),
        steps:steps, tags:tags, lastCookedAt:x.lastCookedAt || null, createdAt:x.createdAt || null,
        custom:!!x.custom // 用户自建 / 改过的菜谱，增量更新菜谱书时保留
      };
    });
    out.cookLogs = out.cookLogs.map(function (x) {
      return {
        id:String(x.id || uid(PREFIX.cookLogs)), recipeId:String(x.recipeId || ''),
        cookedAt:x.cookedAt || new Date().toISOString(), servings:Number(x.servings) || 1,
        note:String(x.note || ''), deductions:Array.isArray(x.deductions) ? x.deductions : []
      };
    });
    out.shoppingItems = out.shoppingItems.map(function (x) {
      return {
        id:String(x.id || uid(PREFIX.shoppingItems)), name:String(x.name || '未命名'),
        quantity:round2(x.quantity), unit:String(x.unit || ''),
        done:!!x.done, source:String(x.source || '手动'), createdAt:x.createdAt || new Date().toISOString()
      };
    });
    out.leftovers = out.leftovers.map(function (x) {
      return {
        id:String(x.id || uid(PREFIX.leftovers)), recipeId:String(x.recipeId || ''),
        cookedAt:x.cookedAt || new Date().toISOString(), expiresAt:x.expiresAt || null,
        note:String(x.note || ''), status:String(x.status || 'active')
      };
    });
    return out;
  }

  function counts(db) {
    var c = {};
    TABLES.forEach(function (t) { c[t] = (db[t] || []).length; });
    c.total = TABLES.reduce(function (s, t) { return s + c[t]; }, 0);
    return c;
  }

  /* ---------------- 菜谱库增量更新（随时可以更新的核心） ----------------
   * 只换菜谱，不重置业务数据：
   *   保留现有食材的库存数量 / 到期日 / 位置 / 备注，保留用户自建食材；
   *   保留 custom:true 的菜谱（用户自建或改过的，按 id 去重优先）；
   *   保留已有菜谱的 lastCookedAt；采购 / 做饭记录 / 剩菜 / 偏好完全不动。
   */
  function bookVersion() { return FP.RecipeBook ? FP.RecipeBook.VERSION : 1; }
  function applyRecipeBook(db, book, today) {
    var next = clone(db);
    var assembled = FP.RecipeBook.assemble(today || todayStr(), next.ingredients, book.recipes);
    var custom = next.recipes.filter(function (r) { return r.custom; });
    var customIds = {};
    custom.forEach(function (r) { customIds[r.id] = true; });
    var lastMap = {};
    next.recipes.forEach(function (r) { if (r.lastCookedAt) lastMap[r.id] = r.lastCookedAt; });
    var rebuilt = assembled.recipes.filter(function (r) { return !customIds[r.id]; }).map(function (r) {
      if (lastMap[r.id]) r.lastCookedAt = lastMap[r.id];
      return r;
    });
    next.ingredients = assembled.ingredients;
    next.recipes = rebuilt.concat(custom);
    next.meta.recipeBookVersion = Math.max(Number(book.version) || 1, bookVersion());
    next.meta.seedVersion = SEED_VERSION;
    next.meta.recipeFocus = book.focus || (FP.RecipeBook && FP.RecipeBook.FOCUS) || '湘菜 + 家常菜';
    return normalize(next);
  }
  function refreshRecipeBook(db, today) {
    return applyRecipeBook(db, {
      version: bookVersion(), focus: FP.RecipeBook.FOCUS, recipes: FP.RecipeBook.recipes
    }, today);
  }
  function exportRecipeBook(db) { return JSON.stringify(FP.RecipeBook.exportBook(db), null, 2); }
  function parseRecipeBook(text) { return FP.RecipeBook.parseBook(text); }

  /* ---------------- 本地持久化 ---------------- */
  function createSeed(today) { return normalize(Seed.build(today)); }
  function load() {
    var raw = null;
    try { raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY); } catch (e) { /* 隐私模式 */ }
    if (raw) {
      try {
        var db = normalize(JSON.parse(raw));
        // 菜谱书或示例数据版本落后 → 增量更新菜谱（旧数据先备份，可回滚）
        if (db.meta.seedVersion < SEED_VERSION || db.meta.recipeBookVersion < bookVersion()) {
          backup(db);
          var fresh = refreshRecipeBook(db);
          fresh.meta.recipeBookUpgradedFrom = db.meta.recipeBookVersion;
          save(fresh);
          return fresh;
        }
        return db;
      }
      catch (e) { console.warn('[饮食库] 本地数据损坏，已回退到示例数据', e); }
    }
    var seed = createSeed();
    save(seed);
    return seed;
  }
  function save(db) {
    if (global.localStorage) {
      try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
      catch (e) { throw new Error('本地存储写入失败（容量已满或浏览器隐私模式）：' + e.message); }
    }
    return db;
  }
  function backup(db) {
    try { if (global.localStorage) global.localStorage.setItem(BACKUP_KEY, JSON.stringify(db)); } catch (e) {}
  }
  /* 手动载入的数据标记为「已是当前版本」，避免下次启动被自动升级覆盖 */
  function markSeedCurrent(db) {
    if (db.meta.seedVersion < SEED_VERSION) db.meta.seedVersion = SEED_VERSION;
    if (db.meta.recipeBookVersion < bookVersion()) db.meta.recipeBookVersion = bookVersion();
    delete db.meta.seedUpgradedFrom;
    delete db.meta.recipeBookUpgradedFrom;
    return db;
  }
  function readBackup() {
    try {
      var r = global.localStorage && global.localStorage.getItem(BACKUP_KEY);
      return r ? markSeedCurrent(normalize(JSON.parse(r))) : null;
    } catch (e) { return null; }
  }
  function storageSize(db) {
    try { return new Blob([JSON.stringify(db)]).size; } catch (e) { return JSON.stringify(db).length; }
  }

  /* ---------------- JSON 导入导出 ---------------- */
  function exportJSON(db) {
    var out = clone(db);
    out.schemaVersion = SCHEMA_VERSION;
    out.app = '饮食库';
    out.format = 'foodpantry-full';
    out.exportedAt = new Date().toISOString();
    return JSON.stringify(out, null, 2);
  }
  function importJSON(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('不是有效的 JSON 文件'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON 根节点必须是对象');
    var hasTable = TABLES.some(function (t) { return Array.isArray(data[t]); });
    if (!hasTable) throw new Error('文件里没有找到饮食库数据表（ingredients / recipes / cookLogs / shoppingItems / leftovers）');
    if (data.schemaVersion && Number(data.schemaVersion) > SCHEMA_VERSION) {
      throw new Error('文件版本（v' + data.schemaVersion + '）高于当前应用（v' + SCHEMA_VERSION + '），请先更新应用');
    }
    var db = markSeedCurrent(normalize(data));
    return { db: db, stats: counts(db) };
  }

  /* ---------------- CSV 导入导出 ---------------- */
  function csvEscape(v) {
    var s = v == null ? '' : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var rows = [], row = [], field = '', inQuotes = false, i = 0;
    while (i < text.length) {
      var c = text.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
  }
  function toCSV(db, table) {
    var cfg = CSV_TABLES[table];
    if (!cfg) throw new Error('未知的数据表：' + table);
    var lines = [cfg.columns.map(csvEscape).join(',')];
    (db[table] || []).forEach(function (item) {
      lines.push(cfg.columns.map(function (col) {
        var v = item[col];
        if (cfg.jsonFields.indexOf(col) >= 0) return csvEscape(JSON.stringify(v == null ? null : v));
        if (cfg.joinFields.indexOf(col) >= 0) return csvEscape((Array.isArray(v) ? v : []).join('|'));
        if (cfg.boolFields.indexOf(col) >= 0) return csvEscape(v ? 'true' : 'false');
        return csvEscape(v == null ? '' : v);
      }).join(','));
    });
    return '\uFEFF' + lines.join('\r\n') + '\r\n';
  }
  function fromCSV(db, table, text, mode) {
    var cfg = CSV_TABLES[table];
    if (!cfg) throw new Error('未知的数据表：' + table);
    var rows = parseCSV(text);
    if (!rows.length) throw new Error('CSV 文件是空的');
    var header = rows[0].map(function (h) { return String(h).trim(); });
    var known = cfg.columns.filter(function (c) { return header.indexOf(c) >= 0; });
    if (!known.length) throw new Error('CSV 表头不匹配，至少需要包含：' + cfg.columns.slice(0, 3).join(' / '));
    var objs = rows.slice(1).map(function (row) {
      var o = {};
      header.forEach(function (h, idx) { if (cfg.columns.indexOf(h) >= 0) o[h] = row[idx] == null ? '' : row[idx]; });
      cfg.numFields.forEach(function (f) { o[f] = round2(o[f]); });
      cfg.joinFields.forEach(function (f) { o[f] = o[f] ? String(o[f]).split('|').filter(Boolean) : []; });
      cfg.jsonFields.forEach(function (f) {
        if (o[f]) { try { o[f] = JSON.parse(o[f]); } catch (e) { o[f] = []; } } else { o[f] = []; }
      });
      cfg.boolFields.forEach(function (f) { o[f] = (o[f] === 'true' || o[f] === '1' || o[f] === '是'); });
      return o;
    });
    var next = clone(db);
    next[table] = (mode === 'append') ? next[table].concat(objs) : objs;
    return { db: normalize(next), stats: { table: table, rows: objs.length, mode: mode || 'replace' } };
  }

  /* ---------------- 查询与推荐 ---------------- */
  function expiringIngredients(db, today) {
    var t = today || todayStr(), win = Number(db.meta.expiryWindowDays) || 3;
    return db.ingredients.filter(function (i) {
      var l = expiryLevel(i, t, win); return l === 'soon' || l === 'expired';
    }).sort(function (a, b) {
      var da = daysUntil(a.expiresAt, t), dbb = daysUntil(b.expiresAt, t);
      return (da == null ? 999 : da) - (dbb == null ? 999 : dbb);
    });
  }
  function leftoverAlerts(db, today) {
    var t = today || todayStr(), win = Number(db.meta.expiryWindowDays) || 3;
    return db.leftovers.filter(function (l) {
      if (l.status && l.status !== 'active') return false;
      var d = daysUntil(l.expiresAt, t);
      return d !== null && d <= win;
    }).sort(function (a, b) {
      var da = daysUntil(a.expiresAt, t), dbb = daysUntil(b.expiresAt, t);
      return (da == null ? 999 : da) - (dbb == null ? 999 : dbb);
    });
  }
  function missingFor(db, recipe, servings, today) {
    var base = Number(recipe.servings) || 2;
    var scale = (Number(servings) || base) / base;
    var t = today || todayStr(), win = Number(db.meta.expiryWindowDays) || 3;
    return (recipe.ingredients || []).map(function (ri) {
      var ing = findById(db.ingredients, ri.ingredientId);
      var need = round2((Number(ri.quantity) || 0) * scale);
      var have = ing ? round2(ing.quantity) : 0;
      return {
        ingredientId: ri.ingredientId, name: ing ? ing.name : '（已删除的食材）',
        unit: ri.unit || (ing && ing.unit) || '',
        need: need, have: have, short: round2(Math.max(0, need - have)),
        found: !!ing, expiry: ing ? expiryLevel(ing, t, win) : 'none'
      };
    });
  }
  /* 命中「湘菜 / 家常」等偏好标签，返回命中的标签定义数组 */
  function preferredTagsOf(tags) {
    var list = Array.isArray(tags) ? tags : [];
    return PREFERRED_TAGS.filter(function (p) { return list.indexOf(p.name) >= 0; });
  }
  function tagBoost(tags) {
    return preferredTagsOf(tags).reduce(function (sum, p) { return sum + p.boost; }, 0);
  }
  function recommend(db, today, limit) {
    var t = today || todayStr();
    var list = db.recipes.map(function (r) {
      var rows = missingFor(db, r, r.servings, t);
      var score = 0, soonNames = [], missing = 0;
      rows.forEach(function (x) {
        if (x.expiry === 'expired') { score += 55; soonNames.push(x.name + '(已过期)'); }
        else if (x.expiry === 'soon') { score += 100; soonNames.push(x.name); }
        else if (x.expiry === 'watch') score += 12;
        if (x.need > 0 && x.short === 0) score += 6;
        if (x.short > 0) missing++;
      });
      var enough = rows.length > 0 && missing === 0;
      if (enough) score += 40; else score -= missing * 12;
      var du = r.lastCookedAt ? daysUntil(r.lastCookedAt, t) : null;
      var last = (du === null || du === undefined) ? null : -du;
      if (last === null) score += 55;
      else {
        score += Math.min(Math.max(last, 0), 30) * 2;
        if (last <= 0) score -= 50;
      }
      // 菜谱取向加权：湘菜 / 家常菜优先，但不足以盖过临期食材
      var prefs = preferredTagsOf(r.tags);
      var boost = prefs.reduce(function (sum, p) { return sum + p.boost; }, 0);
      score += boost;
      return {
        recipeId: r.id, title: r.title, score: score,
        soonNames: soonNames, soonCount: soonNames.length,
        missingCount: missing, enough: enough, lastCookedDays: last,
        preferredTags: prefs.map(function (p) { return p.name; }), tagBoost: boost,
        recipe: r
      };
    });
    list.sort(function (a, b) {
      return (b.score - a.score) || (b.soonCount - a.soonCount) || String(a.title).localeCompare(String(b.title), 'zh-CN');
    });
    return list.slice(0, limit || 3);
  }

  /* ---------------- 做菜扣库存 ---------------- */
  function planCook(db, recipeId, servings, today) {
    var r = findById(db.recipes, recipeId);
    if (!r) throw new Error('菜谱不存在');
    var s = Number(servings) || r.servings || 2;
    var rows = missingFor(db, r, s, today);
    var items = rows.map(function (x) {
      return Object.assign({}, x, { plannedDeduct: round2(Math.min(x.need, x.have)) });
    });
    return {
      recipeId: r.id, recipeTitle: r.title, servings: s, baseServings: r.servings || 2,
      items: items, missing: items.filter(function (x) { return x.short > 0; }),
      enough: items.length > 0 && items.every(function (x) { return x.short === 0; })
    };
  }
  function applyCook(db, plan, opts) {
    opts = opts || {};
    var next = clone(db), deductMap = opts.deductions || {}, changes = [];
    plan.items.forEach(function (it) {
      var ing = findById(next.ingredients, it.ingredientId);
      if (!ing) return;
      var have = round2(ing.quantity);
      var want = Object.prototype.hasOwnProperty.call(deductMap, it.ingredientId)
        ? Number(deductMap[it.ingredientId]) : it.plannedDeduct;
      if (!isFinite(want) || want < 0) want = 0;
      var actual = round2(Math.min(want, have));
      if (actual <= 0) return;
      var after = round2(Math.max(0, have - actual));
      ing.quantity = after;
      ing.updatedAt = new Date().toISOString();
      changes.push({ ingredientId: ing.id, name: ing.name, unit: it.unit, quantityBefore: have, delta: actual, quantityAfter: after });
    });
    var cookedAt = opts.cookedAt || new Date().toISOString();
    var log = {
      id: uid(PREFIX.cookLogs), recipeId: plan.recipeId, cookedAt: cookedAt,
      servings: plan.servings, note: opts.note || '',
      deductions: changes.map(function (c) {
        return { ingredientId: c.ingredientId, quantity: c.delta, unit: c.unit };
      })
    };
    next.cookLogs.unshift(log);
    var r = findById(next.recipes, plan.recipeId);
    if (r) r.lastCookedAt = cookedAt;
    var leftover = null;
    if (opts.makeLeftover) {
      var days = Number(opts.leftoverDays != null ? opts.leftoverDays : next.meta.leftoverDays) || 3;
      leftover = {
        id: uid(PREFIX.leftovers), recipeId: plan.recipeId, cookedAt: cookedAt,
        expiresAt: addDaysToISO(cookedAt, days), note: opts.leftoverNote || '', status: 'active'
      };
      next.leftovers.unshift(leftover);
    }
    return { db: next, log: log, leftover: leftover, changes: changes };
  }

  /* ---------------- 采购清单 ---------------- */
  function clearDoneShopping(db) {
    var next = clone(db);
    var removed = next.shoppingItems.filter(function (x) { return x.done; });
    next.shoppingItems = next.shoppingItems.filter(function (x) { return !x.done; });
    return { db: next, removed: removed };
  }
  function restoreShopping(db, items) {
    var next = clone(db);
    next.shoppingItems = (items || []).concat(next.shoppingItems);
    return next;
  }
  function pushShopping(next, name, qty, unit, source) {
    var existing = next.shoppingItems.find(function (s) {
      return !s.done && s.name === name && s.unit === unit && s.source === source;
    });
    if (existing) { existing.quantity = round2(Number(existing.quantity) + qty); return false; }
    next.shoppingItems.unshift({
      id: uid(PREFIX.shoppingItems), name: name, quantity: round2(qty), unit: unit,
      done: false, source: source, createdAt: new Date().toISOString()
    });
    return true;
  }
  function addMissingToShopping(db, recipeId, servings, today) {
    var plan = planCook(db, recipeId, servings, today);
    var next = clone(db), added = 0;
    plan.missing.forEach(function (it) {
      if (pushShopping(next, it.name, it.short, it.unit, '缺料:' + plan.recipeTitle)) added++;
    });
    return { db: next, added: added, merged: plan.missing.length - added };
  }
  function addLowStockToShopping(db, threshold) {
    var th = threshold == null ? Number(db.meta.lowStockThreshold) || 1 : Number(threshold);
    var next = clone(db), added = 0;
    db.ingredients.forEach(function (i) {
      if (round2(i.quantity) <= th) {
        if (pushShopping(next, i.name, 1, i.unit, '低库存')) added++;
      }
    });
    return { db: next, added: added };
  }

  FP.Store = {
    STORAGE_KEY: STORAGE_KEY, BACKUP_KEY: BACKUP_KEY, SCHEMA_VERSION: SCHEMA_VERSION, SEED_VERSION: SEED_VERSION,
    markSeedCurrent: markSeedCurrent, bookVersion: bookVersion,
    applyRecipeBook: applyRecipeBook, refreshRecipeBook: refreshRecipeBook,
    exportRecipeBook: exportRecipeBook, parseRecipeBook: parseRecipeBook,
    TABLES: TABLES, PREFIX: PREFIX, CSV_TABLES: CSV_TABLES,
    PREFERRED_TAGS: PREFERRED_TAGS, preferredTagsOf: preferredTagsOf, tagBoost: tagBoost,
    uid: uid, clone: clone, ymd: ymd, todayStr: todayStr, round2: round2,
    findById: findById, parseDay: parseDay, daysUntil: daysUntil, addDaysToISO: addDaysToISO,
    expiryLevel: expiryLevel, normalize: normalize, counts: counts,
    createSeed: createSeed, load: load, save: save, backup: backup, readBackup: readBackup, storageSize: storageSize,
    exportJSON: exportJSON, importJSON: importJSON, toCSV: toCSV, fromCSV: fromCSV, parseCSV: parseCSV,
    expiringIngredients: expiringIngredients, leftoverAlerts: leftoverAlerts,
    missingFor: missingFor, recommend: recommend,
    planCook: planCook, applyCook: applyCook,
    clearDoneShopping: clearDoneShopping, restoreShopping: restoreShopping,
    addMissingToShopping: addMissingToShopping, addLowStockToShopping: addLowStockToShopping
  };
})(typeof window !== 'undefined' ? window : globalThis);
