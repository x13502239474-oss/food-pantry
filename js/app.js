/* 饮食库 · 界面与交互（无框架、无构建、无网络请求） */
(function (global) {
  'use strict';
  var FP = global.FP, S = FP.Store;
  var $ = function (id) { return document.getElementById(id); };

  var ICONS = {
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18M11 8h5M11 12h5"/>',
    cart:'<circle cx="9" cy="19.5" r="1.4"/><circle cx="18" cy="19.5" r="1.4"/><path d="M2 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h9.2l1.9-8.4H5.2"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.3 2"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>',
    back:'<path d="M15 18l-6-6 6-6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    dice:'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>',
    upload:'<path d="M12 21V9m0 0 4 4m-4-4-4 4M4 5h16"/>',
    alert:'<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>',
    refresh:'<path d="M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6"/>',
    leaf:'<path d="M4 20c0-9 6-15 16-16 0 10-5 16-14 16H4z"/><path d="M4 20c4-6 8-9 12-11"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'
  };
  function svg(name, size) {
    var s = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function fmtNum(n) { return String(S.round2(n)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function parseLoose(s) {
    if (!s) return null;
    var str = String(s);
    // 带时区 / Z 的 ISO 串交给 Date 解析，避免把 UTC 小时当成本地小时显示
    if (/^\d{4}-\d{2}-\d{2}T/.test(str) && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(str)) {
      var dz = new Date(str);
      return isNaN(dz.getTime()) ? null : dz;
    }
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(str);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(s) {
    var d = parseLoose(s); if (!d) return '未设置';
    var pre = d.getFullYear() === new Date().getFullYear() ? '' : d.getFullYear() + '年';
    return pre + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function fmtDateTime(s) {
    var d = parseLoose(s); if (!d) return '未设置';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function localInput(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function daysText(n) {
    if (n === null || n === undefined) return '未设到期日';
    if (n < 0) return '已过期 ' + (-n) + ' 天';
    if (n === 0) return '今天到期';
    return n + ' 天后到期';
  }
  function badgeFor(level, days) {
    if (level === 'expired') return '<span class="badge expired">' + daysText(days) + '</span>';
    if (level === 'soon') return '<span class="badge soon">' + daysText(days) + '</span>';
    if (level === 'watch') return '<span class="badge">' + daysText(days) + '</span>';
    return '';
  }
  function options(values, selected, includeEmpty) {
    var h = includeEmpty ? '<option value="">（不关联）</option>' : '';
    return h + values.map(function (v) {
      return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(v) + '</option>';
    }).join('');
  }
  function byDataId(selector, id) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) if (els[i].getAttribute('data-id') === id) return els[i];
    return null;
  }
  function recipeTitle(id) {
    var r = S.findById(state.db.recipes, id);
    return r ? r.title : '（已删除的菜谱）';
  }
  function fab(action, label, icon) {
    return '<button class="fab" data-action="' + action + '">' + svg(icon || 'plus', 18) + esc(label) + '</button>';
  }
  function emptyState(title, text) {
    return '<div class="card empty"><strong>' + esc(title) + '</strong>' + esc(text) + '</div>';
  }

  /* ---------------- 状态 ---------------- */
  var state = {
    db: null,
    view: 'today',
    backTo: 'today',
    recipeId: null,
    detailServings: 2,
    randomPick: null,
    recordsSub: 'cook',
    stockFilter: { category:'全部', q:'', onlyExpiring:false, sort:'expiry' },
    recipeFilter: { q:'', tag:'全部', ingredientId:null },
    cookPlan: null,
    confirmFn: null,
    pendingCsv: null,
    undo: null,
    deferredPrompt: null
  };
  var toastTimer = null;

  function toast(msg, withUndo) {
    var root = $('toast-root');
    root.innerHTML = '<div class="toast"><span>' + esc(msg) + '</span>' +
      (withUndo ? '<button type="button" data-action="undo">撤销</button>' : '') +
      '<button type="button" data-action="toast-dismiss" aria-label="关闭提示">' + svg('close', 16) + '</button></div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ''; }, withUndo ? 6500 : 3200);
  }
  function commit(next, opts) {
    opts = opts || {};
    try { S.save(next); } catch (e) { toast(e.message); return; }
    state.db = next;
    if (!opts.silent) render(!!opts.keepScroll);
    if (opts.msg) toast(opts.msg, !!opts.undo);
  }
  function applyTheme() {
    var t = state.db.meta.theme || 'light';
    var resolved = t;
    if (t === 'system' && global.matchMedia) resolved = global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolved);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#141816' : '#1F7A5C');
  }
  function render(keepScroll) {
    var y = global.scrollY;
    applyTheme();
    $('appbar').innerHTML = appbarHtml();
    $('tabbar').innerHTML = tabbarHtml();
    $('view').innerHTML = viewHtml();
    global.scrollTo(0, keepScroll ? y : 0);
  }
  function renderKeepFocus(selector) {
    var y = global.scrollY, pos = null, active = document.activeElement;
    if (active && active.selectionStart != null) { try { pos = active.selectionStart; } catch (e) {} }
    render(true);
    var el = document.querySelector(selector);
    if (el) { el.focus(); if (pos != null) { try { el.setSelectionRange(pos, pos); } catch (e) {} } }
    global.scrollTo(0, y);
  }

  /* ---------------- 骨架 ---------------- */
  function appbarHtml() {
    var sub = state.view === 'recipeDetail' || state.view === 'settings';
    var map = {
      today:['今天吃什么', '先看临期，再做决定'],
      stock:['食材库存', '点 ± 一下就能改数量'],
      recipes:['菜谱库', '缺哪些料一眼看清'],
      shopping:['采购清单', '买完勾一下'],
      records:['做饭与剩菜', '时间线与到期提醒'],
      recipeDetail:['菜谱详情', ''],
      settings:['设置与数据', '']
    };
    var m = map[state.view] || map.today;
    var left = sub ? '<button class="icon-btn" data-action="back" aria-label="返回">' + svg('back', 20) + '</button>' : '';
    var right = sub ? '' : '<button class="icon-btn" data-action="go" data-view="settings" aria-label="打开设置">' + svg('gear', 20) + '</button>';
    return left + '<div class="appbar-txt"><h1>' + esc(m[0]) + '</h1>' + (m[1] ? '<p>' + esc(m[1]) + '</p>' : '') + '</div>' + right;
  }
  function tabbarHtml() {
    var backTab = state.backTo === 'recipeDetail' ? 'recipes' : (state.backTo === 'settings' ? 'today' : state.backTo);
    var active = state.view === 'recipeDetail' ? 'recipes'
      : (state.view === 'settings' ? (backTab || 'today') : state.view);
    var tabs = [['today','今天','sun'],['stock','库存','box'],['recipes','菜谱','book'],['shopping','采购','cart'],['records','记录','clock']];
    return tabs.map(function (t) {
      return '<button class="tab" role="tab" data-action="tab" data-tab="' + t[0] + '" aria-current="' + (active === t[0] ? 'page' : 'false') + '">' +
        svg(t[2], 22) + '<span>' + t[1] + '</span></button>';
    }).join('');
  }
  function viewHtml() {
    switch (state.view) {
      case 'stock': return stockHtml();
      case 'recipes': return recipesHtml();
      case 'recipeDetail': return recipeDetailHtml();
      case 'shopping': return shoppingHtml();
      case 'records': return recordsHtml();
      case 'settings': return settingsHtml();
      default: return todayHtml();
    }
  }

  /* ---------------- 1. 今天吃什么 ---------------- */
  function miniRecipeCard(rec, idx) {
    var r = rec.recipe;
    var last = rec.lastCookedDays === null ? '没做过' : (rec.lastCookedDays <= 0 ? '今天做过' : rec.lastCookedDays + ' 天没做');
    return '<div class="card recipe-card" role="button" tabindex="0" data-action="go" data-view="recipeDetail" data-id="' + esc(r.id) + '">' +
      '<div class="row-title"><span class="rank">' + (idx + 1) + '</span><span class="title">' + esc(r.title) + '</span></div>' +
      '<div class="meta-line">' +
        (rec.preferredTags && rec.preferredTags.length ? '<span class="badge brand">' + esc(rec.preferredTags.join(' / ')) + '</span>' : '') +
        '<span class="badge ' + (rec.enough ? 'ok' : 'soon') + '">' + (rec.enough ? '食材齐备' : '缺 ' + rec.missingCount + ' 样') + '</span>' +
        (rec.soonCount ? '<span class="badge soon">临期 ' + rec.soonCount + ' 样</span>' : '') +
        '<span class="badge">' + esc(last) + '</span>' +
      '</div>' +
      (rec.soonNames.length ? '<p class="tiny muted" style="margin-top:8px">优先消耗：' + esc(rec.soonNames.slice(0, 3).join('、')) + '</p>' : '') +
      '<p class="tiny" style="margin-top:8px;color:var(--brand);font-weight:600">查看菜谱与缺料 →</p>' +
    '</div>';
  }
  function todayHtml() {
    var db = state.db, t = S.todayStr();
    var exp = S.expiringIngredients(db, t);
    var alerts = S.leftoverAlerts(db, t);
    var recs = S.recommend(db, t, 3);
    var h = '';

    h += '<section class="card hero">' +
      '<div class="kicker">TODAY · 本地推荐</div>' +
      '<h1>先从快过期的开始</h1>' +
      '<p>规则：临期食材优先 + 湘菜/家常菜优先 + 最近没做过 + 食材齐备</p>' +
      '<button class="btn btn-primary" data-action="random-recipe">' + svg('dice', 18) + '手气不错 · 随机来一个</button>' +
      '<div class="chips" style="margin-top:12px">' + S.PREFERRED_TAGS.map(function (p) {
        return '<button class="chip" data-action="browse-tag" data-tag="' + esc(p.name) + '">' + esc(p.name) + '菜谱 →</button>';
      }).join('') + '</div>' +
    '</section>';

    if (state.randomPick) {
      var rp = S.findById(db.recipes, state.randomPick);
      if (rp) {
        h += '<div class="card" style="border-color:var(--brand);background:var(--brand-weak)">' +
          '<div class="kicker tiny" style="color:var(--brand-ink);font-weight:700">就吃这个</div>' +
          '<h2 style="font-size:20px;font-weight:750;margin:6px 0">' + esc(rp.title) + '</h2>' +
          '<p class="tiny muted">' + esc(rp.tags.join(' · ') || '未设标签') + ' · ' + rp.ingredients.length + ' 样食材</p>' +
          '<div class="btn-row" style="margin-top:12px">' +
            '<button class="btn btn-ghost" data-action="random-recipe">换一个</button>' +
            '<button class="btn btn-primary" data-action="cook-open" data-id="' + esc(rp.id) + '" data-servings="' + esc(rp.servings) + '">做了</button>' +
          '</div></div>';
      }
    }

    if (alerts.length) {
      var anyExpired = alerts.some(function (l) { return (S.daysUntil(l.expiresAt, t) || 0) < 0; });
      h += '<div class="card alert-card ' + (anyExpired ? 'danger' : '') + '">' +
        '<h2>' + svg('alert', 17) + '剩菜到期提醒 · ' + alerts.length + ' 份</h2>' +
        '<p class="mini-note">按到期时间排序，尽快吃掉。</p>' +
        '<div class="alert-list">' + alerts.map(function (l) {
          return '<button data-action="go" data-view="records" data-sub="leftover">' + esc(recipeTitle(l.recipeId)) + ' · ' + daysText(S.daysUntil(l.expiresAt, t)) + '</button>';
        }).join('') + '</div></div>';
    }

    if (exp.length) {
      h += '<div class="card alert-card">' +
        '<h2>' + svg('leaf', 17) + '临期食材 · ' + exp.length + ' 样</h2>' +
        '<p class="mini-note">下面的推荐会优先用到这些食材；点一下可只看相关菜谱。</p>' +
        '<div class="alert-list">' + exp.map(function (i) {
          return '<button data-action="find-recipes" data-id="' + esc(i.id) + '">' + esc(i.name) + ' · ' + daysText(S.daysUntil(i.expiresAt, t)) + '</button>';
        }).join('') + '</div></div>';
    }

    h += '<div class="section-head"><h2>为你推荐</h2><span>本地实时计算</span></div>';
    h += recs.length ? recs.map(miniRecipeCard).join('') : emptyState('还没有菜谱', '去「菜谱」页新增一道菜，推荐就会出现。');

    // 菜谱取向：直接把湘菜 / 家常菜摆到首页，点一下进详情
    var allRecs = S.recommend(db, t, db.recipes.length);
    function pickRow(tag, n) {
      return allRecs.filter(function (r) { return r.preferredTags.indexOf(tag) >= 0; })
        .slice(0, n).map(function (r) {
          return '<button data-action="go" data-view="recipeDetail" data-id="' + esc(r.recipeId) + '">' + esc(r.title) + '</button>';
        }).join('');
    }
    var xiangPicks = pickRow('湘菜', 3), jiaPicks = pickRow('家常', 3);
    if (xiangPicks || jiaPicks) {
      h += '<div class="section-head"><h2>按口味挑</h2><span>菜谱库以湘菜 / 家常菜为主</span></div><div class="card">' +
        (xiangPicks ? '<p class="tiny muted" style="margin-bottom:6px">湘菜</p><div class="alert-list" style="margin:0 0 12px">' + xiangPicks + '</div>' : '') +
        (jiaPicks ? '<p class="tiny muted" style="margin-bottom:6px">家常菜</p><div class="alert-list" style="margin:0">' + jiaPicks + '</div>' : '') +
      '</div>';
    }

    h += '<div class="section-head"><h2>快捷入口</h2></div><div class="btn-row">' +
      '<button class="btn btn-ghost" data-action="tab" data-tab="stock">' + svg('box', 16) + '库存</button>' +
      '<button class="btn btn-ghost" data-action="tab" data-tab="shopping">' + svg('cart', 16) + '采购</button>' +
      '<button class="btn btn-ghost" data-action="tab" data-tab="records">' + svg('clock', 16) + '记录</button>' +
    '</div>';
    return h;
  }

  /* ---------------- 2. 库存列表 ---------------- */
  function stockHtml() {
    var db = state.db, t = S.todayStr(), win = Number(db.meta.expiryWindowDays) || 3;
    var f = state.stockFilter;
    var cats = ['全部'].concat(db.categories.map(function (c) { return c.name; }));
    var list = db.ingredients.filter(function (i) {
      if (f.category !== '全部' && i.category !== f.category) return false;
      if (f.q && i.name.toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      if (f.onlyExpiring) {
        var l = S.expiryLevel(i, t, win);
        if (l !== 'soon' && l !== 'expired') return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (f.sort === 'name') return a.name.localeCompare(b.name, 'zh-CN');
      if (f.sort === 'qty') return a.quantity - b.quantity;
      var da = S.daysUntil(a.expiresAt, t), dbb = S.daysUntil(b.expiresAt, t);
      return (da == null ? 9999 : da) - (dbb == null ? 9999 : dbb);
    });
    var expCount = S.expiringIngredients(db, t).length;

    var h = '<div class="search-wrap">' + svg('search', 18) +
      '<input class="input" type="search" id="stock-q" data-input="stock-q" placeholder="搜索食材名称" value="' + esc(f.q) + '" aria-label="搜索食材"></div>';
    h += '<div class="chips">' + cats.map(function (c) {
      return '<button class="chip" data-action="stock-cat" data-cat="' + esc(c) + '" aria-pressed="' + (f.category === c) + '">' + esc(c) + '</button>';
    }).join('') + '</div>';
    h += '<div class="chips">' +
      '<button class="chip" data-action="stock-toggle-only" aria-pressed="' + f.onlyExpiring + '">仅看临期</button>' +
      '<button class="chip" data-action="stock-sort">' + (f.sort === 'expiry' ? '按临期排序' : f.sort === 'name' ? '按名称排序' : '按数量排序') + '</button>' +
      '<span style="flex:0 0 auto;font-size:12px;color:var(--text-2);align-self:center;padding-left:4px">' + db.ingredients.length + ' 种在库 · <b class="text-warn">' + expCount + '</b> 样临期</span>' +
    '</div>';

    h += '<div class="section-head"><h2>食材库存</h2><span>点数字可编辑</span></div>';
    if (!list.length) return h + emptyState('没有符合条件的食材', '换个筛选条件，或点右下角新增食材。');
    h += '<div class="card tight">' + list.map(function (i) {
      var d = S.daysUntil(i.expiresAt, t), lvl = S.expiryLevel(i, t, win);
      var cls = (lvl === 'soon' || lvl === 'expired') ? lvl : '';
      return '<div class="list-row stock-row ' + cls + '">' +
        '<div class="grow"><div class="row-title">' + esc(i.name) + badgeFor(lvl, d) +
          (i.quantity <= 0 ? '<span class="badge expired" data-role="stock-empty">缺货</span>' : '') + '</div>' +
          '<div class="row-sub">' + esc(i.category) + ' · ' + esc(i.location || '未填位置') + (i.note ? ' · ' + esc(i.note) : '') + '</div></div>' +
        '<div class="qty-stepper">' +
          '<button type="button" data-action="stock-minus" data-id="' + esc(i.id) + '" aria-label="减少 ' + esc(i.name) + '">' + svg('minus', 18) + '</button>' +
          '<button type="button" class="qty-val" data-action="stock-edit" data-id="' + esc(i.id) + '" aria-label="编辑 ' + esc(i.name) + '">' + fmtNum(i.quantity) + '<small>' + esc(i.unit) + '</small></button>' +
          '<button type="button" class="is-plus" data-action="stock-plus" data-id="' + esc(i.id) + '" aria-label="增加 ' + esc(i.name) + '">' + svg('plus', 18) + '</button>' +
        '</div></div>';
    }).join('') + '</div>';
    h += fab('stock-new', '新增食材');
    return h;
  }
  function quickStock(id, delta) {
    var i = S.findById(state.db.ingredients, id);
    if (!i) return;
    i.quantity = S.round2(Math.max(0, S.round2(i.quantity) + delta));
    i.updatedAt = new Date().toISOString();
    try { S.save(state.db); } catch (e) { toast(e.message); return; }
    var val = byDataId('.qty-val', id);
    if (val) val.innerHTML = fmtNum(i.quantity) + '<small>' + esc(i.unit) + '</small>';
    var row = val && val.closest('.stock-row');
    if (row) {
      var title = row.querySelector('.row-title');
      var old = title && title.querySelector('[data-role="stock-empty"]');
      if (old) old.remove();
      if (i.quantity <= 0 && title) title.insertAdjacentHTML('beforeend', '<span class="badge expired" data-role="stock-empty">缺货</span>');
    }
  }

  /* ---------------- 3. 菜谱列表 / 详情 ---------------- */
  function recipesHtml() {
    var db = state.db, t = S.todayStr(), f = state.recipeFilter;
    var preferredNames = S.PREFERRED_TAGS.map(function (p) { return p.name; });
    var allTags = Array.from(new Set(db.recipes.reduce(function (a, r) { return a.concat(r.tags || []); }, [])));
    var tags = ['全部'].concat(preferredNames).concat(allTags.filter(function (x) { return preferredNames.indexOf(x) < 0; }));
    var list = db.recipes.filter(function (r) {
      if (f.q && r.title.toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      if (f.tag !== '全部' && (r.tags || []).indexOf(f.tag) < 0) return false;
      if (f.ingredientId && !r.ingredients.some(function (ri) { return ri.ingredientId === f.ingredientId; })) return false;
      return true;
    });
    // 菜谱取向：湘菜 / 家常菜排在前面
    list.sort(function (a, b) {
      return S.preferredTagsOf(b.tags).length - S.preferredTagsOf(a.tags).length ||
             String(a.title).localeCompare(String(b.title), 'zh-CN');
    });
    var xiangCount = db.recipes.filter(function (r) { return (r.tags || []).indexOf('湘菜') >= 0; }).length;
    var jiaCount = db.recipes.filter(function (r) { return (r.tags || []).indexOf('家常') >= 0; }).length;
    var h = '<div class="search-wrap">' + svg('search', 18) +
      '<input class="input" type="search" id="recipe-q" data-input="recipe-q" placeholder="搜索菜谱名称" value="' + esc(f.q) + '" aria-label="搜索菜谱"></div>';
    h += '<div class="chips">' + tags.map(function (tag) {
      return '<button class="chip" data-action="recipe-tag" data-tag="' + esc(tag) + '" aria-pressed="' + (f.tag === tag) + '">' + esc(tag) + '</button>';
    }).join('') + '</div>';
    if (f.ingredientId) {
      var ing = S.findById(db.ingredients, f.ingredientId);
      h += '<div class="chips"><button class="chip" data-action="recipe-clear-ingredient" aria-pressed="true">含：' + esc(ing ? ing.name : '?') + ' × 清除</button></div>';
    }
    h += '<div class="section-head"><h2>全部菜谱</h2><span>湘菜 ' + xiangCount + ' · 家常 ' + jiaCount + ' · 当前 ' + list.length + ' 道</span></div>';
    if (!list.length) return h + emptyState('没有符合条件的菜谱', '换个筛选条件，或新增一道菜。');
    h += list.map(function (r) {
      var rows = S.missingFor(db, r, r.servings, t);
      var missing = rows.filter(function (x) { return x.short > 0; }).length;
      var soon = rows.filter(function (x) { return x.expiry === 'soon' || x.expiry === 'expired'; }).length;
      var du = r.lastCookedAt ? -S.daysUntil(r.lastCookedAt, t) : null;
      var last = du === null ? '没做过' : (du <= 0 ? '今天做过' : du + ' 天前做过');
      var prefs = S.preferredTagsOf(r.tags).map(function (p) { return p.name; });
      return '<div class="card recipe-card" role="button" tabindex="0" data-action="go" data-view="recipeDetail" data-id="' + esc(r.id) + '">' +
        '<div class="row-title"><span class="title">' + esc(r.title) + '</span>' +
          (prefs.length ? '<span class="badge brand">' + esc(prefs.join(' / ')) + '</span>' : '') +
          '<span class="badge ' + (missing ? 'soon' : 'ok') + '">' + (missing ? '缺 ' + missing + ' 样' : '齐备') + '</span></div>' +
        '<div class="row-sub">' + esc((r.tags || []).join(' · ') || '未设标签') + ' · ' + r.ingredients.length + ' 样食材 · ' + r.servings + ' 份</div>' +
        '<div class="meta-line">' + (soon ? '<span class="badge soon">临期 ' + soon + ' 样</span>' : '') + '<span class="badge">' + esc(last) + '</span></div>' +
      '</div>';
    }).join('');
    h += fab('recipe-new', '新增菜谱');
    return h;
  }
  function recipeDetailHtml() {
    var db = state.db, t = S.todayStr(), win = Number(db.meta.expiryWindowDays) || 3;
    var r = S.findById(db.recipes, state.recipeId);
    if (!r) return emptyState('菜谱不存在', '可能已被删除。');
    var servings = state.detailServings || r.servings || 2;
    var rows = S.missingFor(db, r, servings, t);
    var missing = rows.filter(function (x) { return x.short > 0; });

    var h = '<div class="card">' +
      '<h2 style="font-size:21px;font-weight:750">' + esc(r.title) + '</h2>' +
      '<div class="meta-line">' + (r.tags || []).map(function (tag) { return '<span class="badge brand">' + esc(tag) + '</span>'; }).join('') + '</div>' +
      '<p class="tiny muted" style="margin-top:10px">上次做：' + esc(r.lastCookedAt ? fmtDateTime(r.lastCookedAt) : '还没做过') + '</p>' +
      '<div class="divider"></div>' +
      '<div class="row-title"><span>做几份</span><span class="spacer" style="flex:1"></span>' +
        '<button class="icon-btn" data-action="servings-minus" aria-label="减少份数">' + svg('minus', 18) + '</button>' +
        '<b style="min-width:42px;text-align:center;font-size:17px">' + servings + '</b>' +
        '<button class="icon-btn is-primary" data-action="servings-plus" aria-label="增加份数">' + svg('plus', 18) + '</button>' +
      '</div><p class="tiny muted" style="margin-top:6px">食材用量会按份数自动换算并用于扣库存。</p>' +
    '</div>';

    if (missing.length) {
      h += '<div class="card alert-card"><h2>' + svg('alert', 17) + '缺 ' + missing.length + ' 样料</h2>' +
        '<p class="mini-note" style="margin-top:6px">' + esc(missing.map(function (x) { return x.name + ' 缺 ' + fmtNum(x.short) + x.unit; }).join('；')) + '</p>' +
        '<button class="btn btn-ghost full sm" style="margin-top:10px" data-action="missing-to-shopping" data-id="' + esc(r.id) + '" data-servings="' + servings + '">把缺料加入采购清单</button></div>';
    } else {
      h += '<div class="card" style="background:var(--ok-bg);border-color:var(--ok);color:var(--ok);font-weight:650;font-size:13.5px">✓ 食材齐备，可以直接做</div>';
    }

    h += '<div class="section-head"><h2>食材清单</h2><span>共 ' + rows.length + ' 样</span></div>';
    h += '<div class="card tight">' + rows.map(function (x) {
      var ing = S.findById(db.ingredients, x.ingredientId);
      var d = ing ? S.daysUntil(ing.expiresAt, t) : null;
      var lvl = ing ? S.expiryLevel(ing, t, win) : 'none';
      return '<div class="list-row"><div class="grow">' +
        '<div class="row-title">' + esc(x.name) + badgeFor(lvl, d) + '</div>' +
        '<div class="row-sub">库存 ' + fmtNum(x.have) + ' ' + esc(x.unit) + ' · 需要 ' + fmtNum(x.need) + ' ' + esc(x.unit) + '</div></div>' +
        '<span class="badge ' + (x.short > 0 ? 'expired' : 'ok') + '">' + (x.short > 0 ? '缺 ' + fmtNum(x.short) : '够') + '</span></div>';
    }).join('') + '</div>';

    h += '<div class="section-head"><h2>做法</h2></div><div class="card"><ol style="padding-left:20px">' +
      (r.steps || []).map(function (s) { return '<li style="padding:6px 0;border-bottom:1px dashed var(--line);font-size:14px">' + esc(s) + '</li>'; }).join('') +
      '</ol></div>';

    h += '<div class="btn-row" style="margin-top:16px">' +
      '<button class="btn btn-ghost" data-action="recipe-edit" data-id="' + esc(r.id) + '">' + svg('edit', 16) + '编辑</button>' +
      '<button class="btn btn-danger" data-action="recipe-delete" data-id="' + esc(r.id) + '">' + svg('trash', 16) + '删除</button>' +
    '</div>';
    h += '<button class="btn btn-primary full" style="margin-top:10px;min-height:52px;font-size:16px" data-action="cook-open">' + svg('check', 18) + '我做了这道菜 · 扣库存</button>';
    return h;
  }

  /* ---------------- 5. 采购清单 ---------------- */
  function shopRow(s) {
    return '<div class="list-row ' + (s.done ? 'is-done' : '') + '">' +
      '<button type="button" class="shop-check ' + (s.done ? 'done' : '') + '" data-action="shopping-toggle" data-id="' + esc(s.id) + '" aria-pressed="' + s.done + '" aria-label="' + (s.done ? '取消完成 ' : '标记完成 ') + esc(s.name) + '">' + svg('check', 16) + '</button>' +
      '<div class="grow"><div class="row-title">' + esc(s.name) + ' <span class="badge">' + fmtNum(s.quantity) + ' ' + esc(s.unit) + '</span></div>' +
        '<div class="row-sub">来源：' + esc(s.source) + '</div></div>' +
      '<button type="button" class="icon-btn" data-action="shopping-delete" data-id="' + esc(s.id) + '" aria-label="删除 ' + esc(s.name) + '">' + svg('trash', 16) + '</button></div>';
  }
  function shoppingHtml() {
    var db = state.db;
    var todo = db.shoppingItems.filter(function (s) { return !s.done; });
    var done = db.shoppingItems.filter(function (s) { return s.done; });
    var units = db.units.map(function (u) { return u.name; });
    var h = '<div class="card"><div class="row-title"><span>采购清单</span><span class="spacer" style="flex:1"></span>' +
      '<span class="badge brand">' + todo.length + ' 项待买</span><span class="badge">' + done.length + ' 项已完成</span></div>' +
      '<div class="btn-row" style="margin-top:12px">' +
        '<button class="btn btn-ghost sm" data-action="shopping-add-low">' + svg('leaf', 15) + '低库存补货</button>' +
        '<button class="btn btn-ghost sm" data-action="shopping-clear-done">' + svg('check', 15) + '清空已完成</button>' +
      '</div></div>';
    h += '<form class="card inline-form" data-form="shopping-add">' +
      '<input class="input" name="name" placeholder="要买什么" required aria-label="采购项名称">' +
      '<input class="input qty" name="quantity" type="number" min="0" step="0.01" value="1" aria-label="数量">' +
      '<select class="select" name="unit" aria-label="单位">' + options(units, '个') + '</select>' +
      '<button class="btn btn-primary" type="submit">' + svg('plus', 16) + '添加</button>' +
    '</form>';
    h += '<div class="section-head"><h2>待买</h2><span>' + todo.length + ' 项</span></div>';
    h += todo.length ? '<div class="card tight">' + todo.map(shopRow).join('') + '</div>' : emptyState('清单是空的', '上面填一项，或从菜谱「缺料」一键加入。');
    if (done.length) {
      h += '<div class="section-head"><h2>已完成</h2><span>' + done.length + ' 项</span></div><div class="card tight">' + done.map(shopRow).join('') + '</div>';
    }
    return h;
  }

  /* ---------------- 6. 做饭记录 / 剩菜 ---------------- */
  function recordsHtml() {
    var db = state.db, t = S.todayStr(), win = Number(db.meta.expiryWindowDays) || 3;
    var h = '<div class="segmented">' +
      '<button data-action="records-sub" data-sub="cook" aria-pressed="' + (state.recordsSub === 'cook') + '">做饭记录</button>' +
      '<button data-action="records-sub" data-sub="leftover" aria-pressed="' + (state.recordsSub === 'leftover') + '">剩菜提醒</button>' +
    '</div>';
    if (state.recordsSub === 'leftover') {
      var lfs = db.leftovers.slice().sort(function (a, b) {
        var da = S.daysUntil(a.expiresAt, t), dbb = S.daysUntil(b.expiresAt, t);
        return (da == null ? 9999 : da) - (dbb == null ? 9999 : dbb);
      });
      h += '<div class="section-head"><h2>剩菜时间线</h2><span>' + lfs.length + ' 份</span></div>';
      h += '<button class="btn btn-ghost full" data-action="leftover-new">' + svg('plus', 16) + '手动登记一份剩菜</button>';
      if (!lfs.length) return h + emptyState('没有剩菜记录', '做菜时勾选「有剩菜」会自动登记。');
      h += '<div class="timeline" style="margin-top:14px">' + lfs.map(function (l) {
        var d = S.daysUntil(l.expiresAt, t);
        var done = l.status && l.status !== 'active';
        var cls = done ? 'ok' : (d !== null && d < 0 ? 'expired' : (d !== null && d <= win ? 'soon' : ''));
        var label = done ? '已处理' : daysText(d);
        return '<div class="tl-item"><div class="tl-date">' + esc(fmtDate(l.cookedAt)) + ' 做好</div>' +
          '<div class="card"><div class="row-title">' + esc(recipeTitle(l.recipeId)) +
            '<span class="badge ' + cls + '">' + esc(label) + '</span></div>' +
            '<p class="tiny muted" style="margin-top:6px">到期：' + esc(fmtDateTime(l.expiresAt)) + (l.note ? ' · ' + esc(l.note) : '') + '</p>' +
            (done ? '' : '<div class="btn-row" style="margin-top:10px"><button class="btn btn-ghost sm" data-action="leftover-done" data-id="' + esc(l.id) + '">标记吃完</button><button class="btn btn-danger sm" data-action="leftover-delete" data-id="' + esc(l.id) + '">删除</button></div>') +
          '</div></div>';
      }).join('') + '</div>';
      return h;
    }
    var logs = db.cookLogs.slice().sort(function (a, b) { return new Date(b.cookedAt) - new Date(a.cookedAt); });
    h += '<div class="section-head"><h2>做饭时间线</h2><span>' + logs.length + ' 次</span></div>';
    if (!logs.length) return h + emptyState('还没有做饭记录', '在菜谱详情点「我做了这道菜」就会生成记录并扣库存。');
    var groups = [], map = {};
    logs.forEach(function (l) {
      var k = fmtDate(l.cookedAt);
      if (!map[k]) { map[k] = []; groups.push({ date: k, items: map[k] }); }
      map[k].push(l);
    });
    h += '<div class="timeline">' + groups.map(function (g) {
      return '<div class="tl-item"><div class="tl-date">' + esc(g.date) + '</div>' + g.items.map(function (l) {
        return '<div class="card" style="margin-bottom:8px"><div class="row-title">' + esc(recipeTitle(l.recipeId)) +
          '<span class="badge">' + l.servings + ' 份</span></div>' +
          '<p class="tiny muted" style="margin-top:4px">' + esc(fmtDateTime(l.cookedAt)) + (l.note ? ' · ' + esc(l.note) : '') + '</p>' +
          ((l.deductions || []).length ? '<details class="deduct"><summary>扣库存明细（' + l.deductions.length + ' 项）</summary><div class="deduct-list-in">' +
            l.deductions.map(function (d) { return '<div>' + esc((S.findById(db.ingredients, d.ingredientId) || {}).name || '已删除食材') + ' −' + fmtNum(d.quantity) + ' ' + esc(d.unit) + '</div>'; }).join('') +
            '</div></details>' : '') +
          '<button class="btn btn-ghost sm" style="margin-top:10px" data-action="cooklog-delete" data-id="' + esc(l.id) + '">删除记录</button></div>';
      }).join('') + '</div>';
    }).join('') + '</div>';
    return h;
  }

  /* ---------------- 7. 设置 ---------------- */
  function settingsHtml() {
    var db = state.db, c = S.counts(db);
    var csvOptions = S.TABLES.map(function (t) { return '<option value="' + t + '">' + esc(S.CSV_TABLES[t].label) + '</option>'; }).join('');
    var sizeKb = (S.storageSize(db) / 1024).toFixed(1);
    var h = '';

    h += '<div class="section-head"><h2>数据导出 / 导入</h2><span>全部在本机完成</span></div>';
    h += '<div class="card">' +
      '<button class="btn btn-primary full" data-action="export-json">' + svg('download', 17) + '导出 JSON 全量备份（可完整恢复）</button>' +
      '<div class="divider"></div>' +
      '<div class="inline-form"><select class="select" id="csv-table" aria-label="选择要导出的表">' + csvOptions + '</select>' +
        '<button class="btn btn-ghost" data-action="export-csv">' + svg('download', 16) + '导出 CSV</button></div>' +
      '<div class="divider"></div>' +
      '<input type="file" id="file-json" class="sr-only" accept=".json,application/json" data-change="import-json-file">' +
      '<input type="file" id="file-csv" class="sr-only" accept=".csv,text/csv" data-change="import-csv-file">' +
      '<div class="inline-form">' +
        '<button class="btn btn-ghost" data-action="pick-json">' + svg('upload', 16) + '导入 JSON</button>' +
        '<select class="select" id="csv-import-table" aria-label="导入到哪张表">' + csvOptions + '</select>' +
        '<select class="select" id="csv-import-mode" aria-label="导入方式"><option value="replace">替换该表</option><option value="append">追加到该表</option></select>' +
        '<button class="btn btn-ghost" data-action="pick-csv">' + svg('upload', 16) + '导入 CSV</button>' +
      '</div>' +
      '<p class="mini-note" style="margin-top:10px">导入前会自动把当前数据备份一份；导入后可以「回滚到导入前」。CSV 带 UTF-8 BOM，可直接用 Excel 打开。</p>' +
      '<div class="btn-row" style="margin-top:12px">' +
        '<button class="btn btn-ghost sm" data-action="rollback">' + svg('refresh', 15) + '回滚到导入前</button>' +
        '<button class="btn btn-ghost sm" data-action="reset-seed">重置示例数据</button>' +
        '<button class="btn btn-danger sm" data-action="clear-all">清空全部</button>' +
      '</div></div>';

    var xiangN = db.recipes.filter(function (r) { return (r.tags || []).indexOf('湘菜') >= 0; }).length;
    var jiaN = db.recipes.filter(function (r) { return (r.tags || []).indexOf('家常') >= 0; }).length;
    var customN = db.recipes.filter(function (r) { return r.custom; }).length;
    h += '<div class="section-head"><h2>菜谱库</h2><span>随时可以更新</span></div>';
    h += '<div class="card">' +
      '<div class="kv"><span>菜谱书版本</span><span>v' + esc(db.meta.recipeBookVersion || 1) + ' / 内置 v' + esc(S.bookVersion()) + ' · ' + esc(db.meta.recipeFocus || '湘菜 + 家常菜') + '</span></div>' +
      '<div class="kv"><span>菜谱构成</span><span>共 ' + c.recipes + ' 道 · 湘菜 ' + xiangN + ' · 家常 ' + jiaN + ' · 自建/改过 ' + customN + '</span></div>' +
      '<p class="mini-note" style="margin:10px 0">四种更新方式：1) 菜谱页右下角「＋」逐条增删改；2) 导出菜谱库 JSON，编辑后再导入（只换菜谱，库存和记录不动）；3) 改仓库里的 js/recipe-book.js 并把 VERSION 加 1，所有设备下次打开自动增量更新；4) 直接导入别人给的菜谱库 JSON。写新食材名会自动补建库存项，不用先建食材。</p>' +
      '<input type="file" id="file-recipe-book" class="sr-only" accept=".json,application/json" data-change="import-recipe-book">' +
      '<div class="btn-row">' +
        '<button class="btn btn-ghost" data-action="export-recipe-book">' + svg('download', 16) + '导出菜谱库</button>' +
        '<button class="btn btn-ghost" data-action="pick-recipe-book">' + svg('upload', 16) + '导入菜谱库</button>' +
      '</div>' +
      '<button class="btn btn-ghost full sm" style="margin-top:8px" data-action="refresh-recipe-book">' + svg('refresh', 15) + '重新载入内置菜谱书（保留自建菜谱）</button>' +
    '</div>';

    h += '<div class="section-head"><h2>数据存在哪里</h2></div><div class="card">' +
      '<div class="kv"><span>存储位置</span><span>本机浏览器 localStorage</span></div>' +
      '<div class="kv"><span>主键</span><span>' + esc(S.STORAGE_KEY) + '</span></div>' +
      '<div class="kv"><span>自动备份键</span><span>' + esc(S.BACKUP_KEY) + '</span></div>' +
      '<div class="kv"><span>当前占用</span><span>' + sizeKb + ' KB</span></div>' +
      '<div class="kv"><span>示例数据版本</span><span>v' + esc(db.meta.seedVersion || 1) + ' · 菜谱书 v' + esc(db.meta.recipeBookVersion || 1) + '</span></div>' +
      '<div class="kv"><span>记录数</span><span>食材 ' + c.ingredients + ' · 菜谱 ' + c.recipes + ' · 采购 ' + c.shoppingItems + ' · 做饭 ' + c.cookLogs + ' · 剩菜 ' + c.leftovers + '</span></div>' +
      '<p class="mini-note" style="margin-top:10px">数据不会上传到任何服务器，也不会在不同设备间自动同步。清除浏览器数据 / 卸载应用会丢失，请定期导出 JSON。Service Worker 只缓存页面静态文件，不缓存业务数据。</p></div>';

    function dictCard(title, key, arr, usageField) {
      var body = '<div class="section-head"><h2>' + esc(title) + '</h2></div><div class="card">' +
        '<div class="alert-list" style="margin:0 0 12px">' + arr.map(function (x) {
          return '<button data-action="' + (key === 'categories' ? 'cat-del' : 'unit-del') + '" data-id="' + esc(x.id) + '" title="点击删除">' + esc(x.name) + ' ×</button>';
        }).join('') + '</div>' +
        '<form class="inline-form" data-form="dict-add" data-key="' + key + '">' +
          '<input class="input" name="name" placeholder="新增' + esc(title) + '名称" required aria-label="新增名称">' +
          '<button class="btn btn-ghost" type="submit">' + svg('plus', 16) + '添加</button></form>' +
        '<p class="mini-note" style="margin-top:8px">正在被' + esc(usageField) + '使用的项目不能删除。</p></div>';
      return body;
    }
    h += dictCard('分类管理', 'categories', db.categories, '食材');
    h += dictCard('单位管理', 'units', db.units, '食材与菜谱');

    h += '<div class="section-head"><h2>偏好</h2></div><div class="card">' +
      '<div class="form-grid">' +
        '<label class="field"><span>临期判定（天内）</span><input class="input" type="number" min="0" max="30" data-change="meta" data-key="expiryWindowDays" value="' + esc(db.meta.expiryWindowDays) + '"></label>' +
        '<label class="field"><span>默认份数</span><input class="input" type="number" min="1" max="12" data-change="meta" data-key="defaultServings" value="' + esc(db.meta.defaultServings) + '"></label>' +
        '<label class="field"><span>剩菜默认可放天数</span><input class="input" type="number" min="1" max="14" data-change="meta" data-key="leftoverDays" value="' + esc(db.meta.leftoverDays) + '"></label>' +
        '<label class="field"><span>低库存阈值</span><input class="input" type="number" min="0" step="0.5" data-change="meta" data-key="lowStockThreshold" value="' + esc(db.meta.lowStockThreshold) + '"></label>' +
      '</div>' +
      '<label class="field"><span>主题</span></label><div class="segmented">' +
        ['light|浅色','dark|深色','system|跟随系统'].map(function (x) {
          var p = x.split('|');
          return '<button data-action="theme" data-theme="' + p[0] + '" aria-pressed="' + (db.meta.theme === p[0]) + '">' + p[1] + '</button>';
        }).join('') + '</div></div>';

    h += '<div class="section-head"><h2>安装与更新</h2></div><div class="card">' +
      '<div class="btn-row">' +
        '<button class="btn btn-ghost" data-action="install-app">' + svg('download', 16) + '安装到手机</button>' +
        '<button class="btn btn-ghost" data-action="check-update">' + svg('refresh', 16) + '检查更新</button>' +
      '</div>' +
      '<p class="mini-note" style="margin-top:10px">Android Chrome：浏览器菜单 →「安装应用 / 添加到主屏幕」；iPhone Safari：分享 →「添加到主屏幕」。需要 HTTPS 或 localhost。安装后可离线使用。</p>' +
      '<div class="divider"></div>' +
      '<div class="kv"><span>应用版本</span><span>v1.1.0 · schema v' + S.SCHEMA_VERSION + '</span></div>' +
      '<div class="kv"><span>菜谱取向</span><span>' + esc(db.meta.recipeFocus || '湘菜 + 家常菜') + '</span></div>' +
      '<div class="kv"><span>仓库数据</span><span>全部为示例假数据</span></div>' +
      '<p class="mini-note" style="margin-top:8px">仓库内不含任何真实家庭数据；首次运行时按当天日期生成示例，之后所有改动只保存在你自己的浏览器里。</p></div>';
    return h;
  }

  /* ---------------- 弹层 ---------------- */
  function sheet(title, sub, body) {
    return '<div class="modal-mask" data-action="modal-mask"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="sheet-grip"></div><h2>' + esc(title) + '</h2>' + (sub ? '<p class="sheet-sub">' + esc(sub) + '</p>' : '') + body + '</div></div>';
  }
  function openModal(html) { $('modal-root').innerHTML = html; document.body.style.overflow = 'hidden'; }
  function closeModal() { $('modal-root').innerHTML = ''; document.body.style.overflow = ''; }
  function confirmSheet(title, text, fn) {
    state.confirmFn = fn;
    openModal(sheet(title, '', '<p class="mini-note" style="font-size:13.5px;color:var(--text-2)">' + esc(text) + '</p>' +
      '<div class="sheet-actions"><button class="btn btn-ghost" data-action="modal-close">取消</button>' +
      '<button class="btn btn-danger" data-action="confirm-yes">确认</button></div>'));
  }
  function ingredientModal(id) {
    var db = state.db, isNew = !id;
    var i = id ? S.findById(db.ingredients, id) : { name:'', category:db.categories[0] ? db.categories[0].name : '', unit:db.units[0] ? db.units[0].name : '', quantity:1, expiresAt:'', location:'冷藏', note:'' };
    if (!i) return;
    var body = '<form data-form="ingredient" data-id="' + esc(id || '') + '">' +
      '<label class="field"><span>名称</span><input class="input" name="name" value="' + esc(i.name) + '" required></label>' +
      '<div class="form-grid">' +
        '<label class="field"><span>分类</span><select class="select" name="category">' + options(db.categories.map(function (c) { return c.name; }), i.category) + '</select></label>' +
        '<label class="field"><span>单位</span><select class="select" name="unit">' + options(db.units.map(function (u) { return u.name; }), i.unit) + '</select></label>' +
        '<label class="field"><span>库存数量</span><input class="input" type="number" min="0" step="0.01" name="quantity" value="' + esc(i.quantity) + '" required></label>' +
        '<label class="field"><span>到期日</span><input class="input" type="date" name="expiresAt" value="' + esc(i.expiresAt || '') + '"></label>' +
        '<label class="field"><span>存放位置</span><input class="input" name="location" value="' + esc(i.location) + '" placeholder="冷藏 / 冷冻 / 常温"></label>' +
      '</div>' +
      '<label class="field"><span>备注</span><input class="input" name="note" value="' + esc(i.note) + '"></label>' +
      '<div class="sheet-actions">' + (isNew ? '' : '<button type="button" class="btn btn-danger" data-action="stock-delete" data-id="' + esc(id) + '">删除</button>') +
        '<button type="button" class="btn btn-ghost" data-action="modal-close">取消</button>' +
        '<button type="submit" class="btn btn-primary">保存</button></div></form>';
    openModal(sheet(isNew ? '新增食材' : '编辑食材', '库存数量也可以在列表上用 ± 快速修改。', body));
  }
  function riRow(ri) {
    var db = state.db;
    var ingOpts = db.ingredients.map(function (i) {
      return '<option value="' + esc(i.id) + '"' + (ri && ri.ingredientId === i.id ? ' selected' : '') + '>' + esc(i.name) + '</option>';
    }).join('');
    var unitList = db.units.map(function (u) { return u.name; });
    if (ri && ri.unit && unitList.indexOf(ri.unit) < 0) unitList.push(ri.unit);
    return '<div class="ri-row" data-ri-row>' +
      '<select class="select" name="ri_id" aria-label="食材">' + ingOpts + '</select>' +
      '<input class="input" type="number" min="0" step="0.01" name="ri_qty" value="' + esc(ri ? ri.quantity : 1) + '" aria-label="用量">' +
      '<select class="select" name="ri_unit" aria-label="单位">' + options(unitList, ri ? ri.unit : (db.ingredients[0] ? db.ingredients[0].unit : '')) + '</select>' +
      '<button type="button" class="icon-btn" data-action="ri-remove" aria-label="移除这一行">' + svg('close', 14) + '</button></div>';
  }
  function recipeModal(id) {
    var db = state.db, isNew = !id;
    var r = id ? S.findById(db.recipes, id) : { title:'', servings:db.meta.defaultServings || 2, tags:[], ingredients:[{ ingredientId: db.ingredients[0] ? db.ingredients[0].id : '', quantity:1, unit:'个' }], steps:[] };
    if (!r) return;
    var body = '<form data-form="recipe" data-id="' + esc(id || '') + '">' +
      '<label class="field"><span>标题</span><input class="input" name="title" value="' + esc(r.title) + '" required></label>' +
      '<div class="form-grid">' +
        '<label class="field"><span>基准份数</span><input class="input" type="number" min="1" max="20" name="servings" value="' + esc(r.servings) + '"></label>' +
        '<label class="field"><span>标签（逗号分隔）</span><input class="input" name="tags" value="' + esc((r.tags || []).join(',')) + '" placeholder="家常,快手"></label>' +
      '</div>' +
      '<label class="field"><span>食材（用量按基准份数）</span></label>' +
      '<div id="ri-list">' + (r.ingredients || []).map(riRow).join('') + '</div>' +
      '<button type="button" class="btn btn-ghost full sm" data-action="ri-add">' + svg('plus', 15) + '加一行食材</button>' +
      '<label class="field" style="margin-top:12px"><span>步骤（每行一步）</span><textarea class="textarea" name="steps" placeholder="第一步…&#10;第二步…">' + esc((r.steps || []).join('\n')) + '</textarea></label>' +
      '<div class="sheet-actions">' + (isNew ? '' : '<button type="button" class="btn btn-danger" data-action="recipe-delete" data-id="' + esc(id) + '">删除</button>') +
        '<button type="button" class="btn btn-ghost" data-action="modal-close">取消</button>' +
        '<button type="submit" class="btn btn-primary">保存</button></div></form>';
    openModal(sheet(isNew ? '新增菜谱' : '编辑菜谱', '食材用量以「基准份数」为准，做菜时按实际份数换算。', body));
  }
  function cookModal(plan) {
    state.cookPlan = plan;
    var body = '<form data-form="cook">' +
      '<div class="sheet-note"><b>' + esc(plan.recipeTitle) + '</b> · ' + plan.servings + ' 份。下面是计划扣除量，可手动修正；库存不足时不会扣成负数。</div>' +
      (plan.items.length ? '<div>' + plan.items.map(function (it) {
        var d = S.daysUntil((S.findById(state.db.ingredients, it.ingredientId) || {}).expiresAt, S.todayStr());
        return '<div class="deduct-row">' +
          '<div class="deduct-name">' + esc(it.name) + badgeFor(it.expiry, d) + '</div>' +
          '<div class="deduct-meta">库存 ' + fmtNum(it.have) + ' ' + esc(it.unit) + ' · 需要 ' + fmtNum(it.need) + ' ' + esc(it.unit) +
            (it.short > 0 ? ' · <span class="text-danger">缺 ' + fmtNum(it.short) + '</span>' : '') + '</div>' +
          '<label class="sr-only" for="deduct_' + esc(it.ingredientId) + '">' + esc(it.name) + ' 实际扣除</label>' +
          '<input class="input" id="deduct_' + esc(it.ingredientId) + '" type="number" min="0" max="' + fmtNum(it.have) + '" step="0.01" name="deduct_' + esc(it.ingredientId) + '" value="' + fmtNum(it.plannedDeduct) + '">' +
        '</div>';
      }).join('') + '</div>' : '<div class="empty">这道菜还没有登记食材</div>') +
      (plan.missing.length ? '<button type="button" class="btn btn-ghost full" style="margin-top:12px" data-action="missing-to-shopping" data-id="' + esc(plan.recipeId) + '" data-servings="' + plan.servings + '">把 ' + plan.missing.length + ' 样缺料加入采购清单</button>' : '') +
      '<label class="field" style="margin-top:12px"><span>备注（可选）</span><input class="input" name="note" placeholder="例如：少放盐"></label>' +
      '<label class="check-row"><input type="checkbox" name="makeLeftover" value="1"> 有剩菜，同时登记剩菜提醒</label>' +
      '<label class="field"><span>剩菜可放天数</span><input class="input" type="number" min="1" max="14" name="leftoverDays" value="' + esc(state.db.meta.leftoverDays) + '"></label>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">取消</button>' +
        '<button type="submit" class="btn btn-primary">确认做了并扣库存</button></div></form>';
    openModal(sheet('做一道菜 · 确认扣库存', '确认后会生成做饭记录，并把食材数量写回库存。', body));
  }
  function leftoverModal() {
    var db = state.db, now = new Date(), exp = new Date(now.getTime() + (Number(db.meta.leftoverDays) || 3) * 86400000);
    var body = '<form data-form="leftover">' +
      '<label class="field"><span>对应菜谱</span><select class="select" name="recipeId">' +
        '<option value="">（不关联菜谱）</option>' + db.recipes.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.title) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>做好时间</span><input class="input" type="datetime-local" name="cookedAt" value="' + localInput(now) + '" required></label>' +
      '<label class="field"><span>到期时间</span><input class="input" type="datetime-local" name="expiresAt" value="' + localInput(exp) + '" required></label>' +
      '<label class="field"><span>备注</span><input class="input" name="note" placeholder="例如：冷藏，密封盒"></label>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">取消</button>' +
        '<button type="submit" class="btn btn-primary">保存</button></div></form>';
    openModal(sheet('登记一份剩菜', '到期前会在「今天吃什么」顶部提醒。', body));
  }

  /* ---------------- 导入导出 ---------------- */
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function dateTag() { return S.todayStr(); }
  function readFile(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(String(reader.result || '')); };
    reader.onerror = function () { toast('读取文件失败'); };
    reader.readAsText(file, 'utf-8');
  }

  /* ---------------- 事件 ---------------- */
  function go(el) {
    var v = el.getAttribute('data-view');
    if (v === 'recipeDetail') {
      state.recipeId = el.getAttribute('data-id');
      var r = S.findById(state.db.recipes, state.recipeId);
      state.detailServings = r ? r.servings : 2;
      state.view = v;
    } else if (v === 'settings') {
      state.backTo = state.view === 'settings' ? 'today' : state.view;
      state.view = v;
    } else if (v === 'records') {
      if (el.getAttribute('data-sub')) state.recordsSub = el.getAttribute('data-sub');
      state.view = v;
    } else state.view = v;
    render();
  }
  function onClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action'), id = el.getAttribute('data-id'), db = state.db;

    if (action === 'modal-mask') { if (e.target === el) closeModal(); return; }

    switch (action) {
      case 'tab': state.view = el.getAttribute('data-tab'); render(); break;
      case 'go': go(el); break;
      case 'back': state.view = state.view === 'recipeDetail' ? 'recipes' : (state.backTo || 'today'); render(); break;
      case 'modal-close': closeModal(); break;
      case 'confirm-yes': {
        var fn = state.confirmFn; state.confirmFn = null; closeModal();
        if (fn) fn();
        break;
      }
      case 'toast-dismiss': $('toast-root').innerHTML = ''; break;
      case 'undo': {
        if (state.undo && state.undo.type === 'shopping') {
          var restored = S.restoreShopping(db, state.undo.payload);
          state.undo = null; commit(restored, { msg: '已撤销清空' });
        }
        break;
      }
      /* 今天 */
      case 'random-recipe': {
        if (!db.recipes.length) { toast('还没有菜谱'); break; }
        var pool = S.recommend(db, S.todayStr(), Math.min(5, db.recipes.length));
        var pick = pool[Math.floor(Math.random() * pool.length)] || db.recipes[Math.floor(Math.random() * db.recipes.length)];
        state.randomPick = pick.recipeId;
        render(true);
        toast('随机选中：' + pick.title);
        break;
      }
      case 'find-recipes': state.recipeFilter.ingredientId = id; state.view = 'recipes'; render(); break;
      case 'browse-tag': {
        state.recipeFilter.tag = el.getAttribute('data-tag');
        state.recipeFilter.q = '';
        state.recipeFilter.ingredientId = null;
        state.view = 'recipes';
        render();
        break;
      }
      /* 库存 */
      case 'stock-plus': quickStock(id, 1); break;
      case 'stock-minus': quickStock(id, -1); break;
      case 'stock-edit': ingredientModal(id); break;
      case 'stock-new': ingredientModal(null); break;
      case 'stock-cat': state.stockFilter.category = el.getAttribute('data-cat'); render(true); break;
      case 'stock-toggle-only': state.stockFilter.onlyExpiring = !state.stockFilter.onlyExpiring; render(true); break;
      case 'stock-sort': {
        var order = ['expiry', 'name', 'qty'];
        state.stockFilter.sort = order[(order.indexOf(state.stockFilter.sort) + 1) % order.length];
        render(true); break;
      }
      case 'stock-delete': {
        var ingName = (S.findById(db.ingredients, id) || {}).name || '该食材';
        confirmSheet('删除食材', '将删除「' + ingName + '」。引用了它的菜谱会显示「（已删除的食材）」，此操作不可撤销。', function () {
          var next = S.clone(state.db);
          next.ingredients = next.ingredients.filter(function (x) { return x.id !== id; });
          commit(next, { msg: '已删除食材' });
        });
        break;
      }
      /* 菜谱 */
      case 'recipe-new': recipeModal(null); break;
      case 'recipe-edit': recipeModal(id); break;
      case 'recipe-tag': state.recipeFilter.tag = el.getAttribute('data-tag'); render(true); break;
      case 'recipe-clear-ingredient': state.recipeFilter.ingredientId = null; render(true); break;
      case 'recipe-delete': {
        var rName = (S.findById(db.recipes, id) || {}).title || '该菜谱';
        confirmSheet('删除菜谱', '将删除「' + rName + '」，此操作不可撤销。', function () {
          var next = S.clone(state.db);
          next.recipes = next.recipes.filter(function (x) { return x.id !== id; });
          commit(next, { msg: '已删除菜谱' });
        });
        break;
      }
      case 'servings-plus': state.detailServings = Math.min(12, (state.detailServings || 2) + 1); render(true); break;
      case 'servings-minus': state.detailServings = Math.max(1, (state.detailServings || 2) - 1); render(true); break;
      case 'ri-add': {
        var box = $('ri-list'); if (box) box.insertAdjacentHTML('beforeend', riRow(null));
        break;
      }
      case 'ri-remove': { var row = el.closest('.ri-row'); if (row) row.remove(); break; }
      /* 做菜 */
      case 'cook-open': {
        var rid = id || state.recipeId;
        var sv = Number(el.getAttribute('data-servings')) || (state.view === 'recipeDetail' ? state.detailServings : (S.findById(db.recipes, rid) || {}).servings) || 2;
        cookModal(S.planCook(db, rid, sv, S.todayStr()));
        break;
      }
      case 'missing-to-shopping': {
        var res = S.addMissingToShopping(db, id, Number(el.getAttribute('data-servings')) || 2, S.todayStr());
        commit(res.db, { msg: '已加入采购清单：' + res.added + ' 项' + (res.merged ? '（' + res.merged + ' 项已合并到现有条目）' : '') });
        break;
      }
      /* 采购 */
      case 'shopping-toggle': {
        var next2 = S.clone(db), item = S.findById(next2.shoppingItems, id);
        if (item) { item.done = !item.done; commit(next2, { keepScroll:true }); }
        break;
      }
      case 'shopping-delete': {
        var next3 = S.clone(db);
        next3.shoppingItems = next3.shoppingItems.filter(function (x) { return x.id !== id; });
        commit(next3, { msg: '已删除', keepScroll:true });
        break;
      }
      case 'shopping-clear-done': {
        var cleared = S.clearDoneShopping(db);
        if (!cleared.removed.length) { toast('没有已完成的项目'); break; }
        state.undo = { type:'shopping', payload: cleared.removed };
        commit(cleared.db, { msg: '已清除 ' + cleared.removed.length + ' 项', keepScroll:true, undo:true });
        break;
      }
      case 'shopping-add-low': {
        var low = S.addLowStockToShopping(db);
        commit(low.db, { msg: low.added ? '已补入 ' + low.added + ' 项低库存食材' : '没有需要补货的低库存食材', keepScroll:true });
        break;
      }
      /* 记录 / 剩菜 */
      case 'records-sub': state.recordsSub = el.getAttribute('data-sub'); render(true); break;
      case 'leftover-new': leftoverModal(); break;
      case 'leftover-done': {
        var n4 = S.clone(db), l4 = S.findById(n4.leftovers, id);
        if (l4) { l4.status = 'eaten'; commit(n4, { msg:'已标记吃完', keepScroll:true }); }
        break;
      }
      case 'leftover-delete': {
        var n5 = S.clone(db);
        n5.leftovers = n5.leftovers.filter(function (x) { return x.id !== id; });
        commit(n5, { msg:'已删除', keepScroll:true });
        break;
      }
      case 'cooklog-delete': {
        var n6 = S.clone(db);
        n6.cookLogs = n6.cookLogs.filter(function (x) { return x.id !== id; });
        commit(n6, { msg:'已删除记录（库存不会回滚）', keepScroll:true });
        break;
      }
      /* 设置 */
      case 'export-json': {
        download('饮食库-' + dateTag() + '.json', S.exportJSON(db), 'application/json;charset=utf-8');
        toast('已导出 JSON 全量备份');
        break;
      }
      case 'export-csv': {
        var tbl = $('csv-table') ? $('csv-table').value : 'ingredients';
        download('饮食库-' + S.CSV_TABLES[tbl].label + '-' + dateTag() + '.csv', S.toCSV(db, tbl), 'text/csv;charset=utf-8');
        toast('已导出「' + S.CSV_TABLES[tbl].label + '」CSV');
        break;
      }
      case 'pick-json': $('file-json').click(); break;
      case 'pick-csv': {
        state.pendingCsv = { table: $('csv-import-table').value, mode: $('csv-import-mode').value };
        $('file-csv').click();
        break;
      }
      /* 菜谱库：只换菜谱，不动库存 / 采购 / 记录 / 剩菜 */
      case 'export-recipe-book': {
        download('饮食库-菜谱库-v' + S.bookVersion() + '-' + dateTag() + '.json',
                 S.exportRecipeBook(db), 'application/json;charset=utf-8');
        toast('已导出菜谱库（' + db.recipes.length + ' 道），可直接编辑后再导入');
        break;
      }
      case 'pick-recipe-book': $('file-recipe-book').click(); break;
      case 'refresh-recipe-book': {
        confirmSheet('重新载入内置菜谱书', '将用 js/recipe-book.js 里的内置菜谱替换内置菜谱；你自己新增或改过的菜谱、以及库存/采购/记录全部保留。', function () {
          S.backup(state.db);
          var next = S.refreshRecipeBook(state.db, S.todayStr());
          commit(next, { msg: '菜谱库已重新载入，共 ' + next.recipes.length + ' 道' });
        });
        break;
      }
      case 'rollback': {
        var bk = S.readBackup();
        if (!bk) { toast('没有可用的导入前备份'); break; }
        confirmSheet('回滚数据', '将用「导入前自动备份」覆盖当前数据，当前未导出的改动会丢失。', function () {
          commit(bk, { msg: '已回滚到导入前' });
        });
        break;
      }
      case 'reset-seed': {
        confirmSheet('重置示例数据', '将用仓库内置的示例假数据覆盖当前全部内容，建议先导出 JSON 备份。', function () {
          state.randomPick = null; state.recipeFilter.ingredientId = null;
          commit(S.createSeed(), { msg: '已重置为示例假数据' });
        });
        break;
      }
      case 'clear-all': {
        confirmSheet('清空全部数据', '将删除全部食材、菜谱、采购、做饭记录与剩菜，只保留分类、单位和偏好设置。', function () {
          var empty = S.normalize({ meta: S.clone(db.meta) });
          state.randomPick = null;
          commit(empty, { msg: '已清空全部数据' });
        });
        break;
      }
      case 'cat-del': case 'unit-del': {
        var key = action === 'cat-del' ? 'categories' : 'units';
        var arr = db[key], target = S.findById(arr, id);
        if (!target) break;
        var used = key === 'categories'
          ? db.ingredients.some(function (x) { return x.category === target.name; })
          : db.ingredients.some(function (x) { return x.unit === target.name; }) || db.recipes.some(function (r) { return r.ingredients.some(function (ri) { return ri.unit === target.name; }); });
        if (used) { toast('还有食材/菜谱在用「' + target.name + '」，不能删除'); break; }
        var n7 = S.clone(db);
        n7[key] = n7[key].filter(function (x) { return x.id !== id; });
        commit(n7, { msg: '已删除' });
        break;
      }
      case 'theme': {
        var n8 = S.clone(db); n8.meta.theme = el.getAttribute('data-theme');
        commit(n8); break;
      }
      case 'install-app': {
        if (state.deferredPrompt) {
          state.deferredPrompt.prompt();
          state.deferredPrompt.userChoice.then(function () { state.deferredPrompt = null; render(true); });
        } else toast('请用浏览器菜单「安装应用 / 添加到主屏幕」');
        break;
      }
      case 'check-update': {
        if (!('serviceWorker' in navigator)) { toast('当前环境不支持离线缓存'); break; }
        navigator.serviceWorker.getRegistration().then(function (reg) {
          if (!reg) { toast('尚未注册离线缓存（请用 HTTP/HTTPS 打开）'); return; }
          reg.update().then(function () { toast('已检查更新；新版本会在下次打开时生效'); });
        });
        break;
      }
    }
  }
  function onSubmit(e) {
    var form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute('data-form'), id = form.getAttribute('data-id');
    var fd = new FormData(form), db = state.db, next;

    if (kind === 'shopping-add') {
      var name = String(fd.get('name') || '').trim();
      if (!name) return;
      next = S.clone(db);
      next.shoppingItems.unshift({ id:S.uid('sh'), name:name, quantity:S.round2(fd.get('quantity')), unit:String(fd.get('unit') || ''), done:false, source:'手动', createdAt:new Date().toISOString() });
      form.reset();
      commit(next, { msg:'已添加「' + name + '」' });
      return;
    }
    if (kind === 'dict-add') {
      var key = form.getAttribute('data-key');
      var val = String(fd.get('name') || '').trim();
      if (!val) return;
      next = S.clone(db);
      if (next[key].some(function (x) { return x.name === val; })) { toast('已经存在了'); return; }
      next[key].push({ id:S.uid(key === 'categories' ? 'cat' : 'u'), name:val, sortOrder:next[key].length + 1 });
      commit(next, { msg:'已添加「' + val + '」' });
      return;
    }
    if (kind === 'ingredient') {
      next = S.clone(db);
      var obj = {
        id: id || S.uid('ing'), name:String(fd.get('name') || '').trim(), category:String(fd.get('category') || ''),
        unit:String(fd.get('unit') || ''), quantity:S.round2(fd.get('quantity')),
        expiresAt:String(fd.get('expiresAt') || '') || null, location:String(fd.get('location') || ''),
        note:String(fd.get('note') || ''), createdAt:(S.findById(db.ingredients, id) || {}).createdAt || new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      if (!obj.name) return;
      if (id) {
        var idx = -1;
        next.ingredients.forEach(function (x, k) { if (x.id === id) idx = k; });
        if (idx >= 0) next.ingredients[idx] = obj;
      } else next.ingredients.unshift(obj);
      closeModal(); commit(next, { msg:'已保存食材' });
      return;
    }
    if (kind === 'recipe') {
      var rows = Array.prototype.slice.call(form.querySelectorAll('[data-ri-row]'));
      var ings = rows.map(function (row) {
        return { ingredientId:row.querySelector('[name="ri_id"]').value, quantity:S.round2(row.querySelector('[name="ri_qty"]').value), unit:row.querySelector('[name="ri_unit"]').value };
      }).filter(function (x) { return x.ingredientId; });
      var steps = String(fd.get('steps') || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var tags = String(fd.get('tags') || '').split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
      next = S.clone(db);
      var prev = S.findById(db.recipes, id);
      var robj = {
        id: id || S.uid('r'), title:String(fd.get('title') || '').trim(),
        servings:Number(fd.get('servings')) || 2, ingredients:ings, steps:steps, tags:tags,
        lastCookedAt:prev ? prev.lastCookedAt : null, createdAt:prev ? prev.createdAt : new Date().toISOString(),
        custom:true // 自建或改过的菜谱，菜谱库更新时保留
      };
      if (!robj.title) return;
      if (id) {
        var ridx = -1;
        next.recipes.forEach(function (x, k) { if (x.id === id) ridx = k; });
        if (ridx >= 0) next.recipes[ridx] = robj;
      } else next.recipes.unshift(robj);
      closeModal(); commit(next, { msg:'已保存菜谱' });
      return;
    }
    if (kind === 'cook') {
      if (!state.cookPlan) return;
      var deductions = {};
      state.cookPlan.items.forEach(function (it) { deductions[it.ingredientId] = Number(fd.get('deduct_' + it.ingredientId)) || 0; });
      var result = S.applyCook(db, state.cookPlan, {
        deductions:deductions, note:String(fd.get('note') || ''),
        makeLeftover:!!fd.get('makeLeftover'), leftoverDays:Number(fd.get('leftoverDays')) || 3
      });
      closeModal();
      commit(result.db, { msg:'已记录「' + state.cookPlan.recipeTitle + '」· 扣除 ' + result.changes.length + ' 种食材' + (result.leftover ? ' · 已登记剩菜' : '') });
      state.cookPlan = null;
      return;
    }
    if (kind === 'leftover') {
      next = S.clone(db);
      next.leftovers.unshift({
        id:S.uid('lf'), recipeId:String(fd.get('recipeId') || ''),
        cookedAt:new Date(String(fd.get('cookedAt'))).toISOString(),
        expiresAt:new Date(String(fd.get('expiresAt'))).toISOString(),
        note:String(fd.get('note') || ''), status:'active'
      });
      closeModal(); commit(next, { msg:'已登记剩菜' });
      return;
    }
  }
  function onChange(e) {
    var el = e.target.closest('[data-change]');
    if (!el) return;
    var key = el.getAttribute('data-change');
    if (key === 'meta') {
      var k = el.getAttribute('data-key');
      var next = S.clone(state.db);
      next.meta[k] = Number(el.value);
      commit(next, { silent:true, msg:'偏好已保存' });
      return;
    }
    if (key === 'import-recipe-book') {
      var fb = el.files && el.files[0];
      if (!fb) return;
      readFile(fb, function (text) {
        try {
          var book = S.parseRecipeBook(text);
          S.backup(state.db);
          var nextBook = S.applyRecipeBook(state.db, book, S.todayStr());
          commit(nextBook, { msg:'菜谱库导入成功：' + book.recipes.length + ' 道菜（库存与记录未改动，旧数据已备份）' });
        } catch (err) { toast('菜谱库导入失败：' + err.message); }
        el.value = '';
      });
      return;
    }
    if (key === 'import-json-file') {
      var file = el.files && el.files[0];
      if (!file) return;
      readFile(file, function (text) {
        try {
          S.backup(state.db);
          var res = S.importJSON(text);
          state.randomPick = null;
          commit(res.db, { msg:'导入成功：' + res.stats.ingredients + ' 种食材 / ' + res.stats.recipes + ' 道菜（旧数据已备份）' });
        } catch (err) { toast('导入失败：' + err.message); }
        el.value = '';
      });
      return;
    }
    if (key === 'import-csv-file') {
      var f2 = el.files && el.files[0];
      if (!f2) return;
      var cfg = state.pendingCsv || { table:'ingredients', mode:'replace' };
      readFile(f2, function (text) {
        try {
          S.backup(state.db);
          var res2 = S.fromCSV(state.db, cfg.table, text, cfg.mode);
          commit(res2.db, { msg:'CSV 导入成功：' + S.CSV_TABLES[cfg.table].label + ' ' + res2.stats.rows + ' 行（' + (cfg.mode === 'append' ? '追加' : '替换') + '）' });
        } catch (err) { toast('CSV 导入失败：' + err.message); }
        el.value = '';
      });
    }
  }
  function onInput(e) {
    var el = e.target.closest('[data-input]');
    if (!el) return;
    var key = el.getAttribute('data-input');
    if (key === 'stock-q') state.stockFilter.q = el.value;
    else if (key === 'recipe-q') state.recipeFilter.q = el.value;
    else return;
    renderKeepFocus('[data-input="' + key + '"]');
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    state.db = S.load();
    if (state.db.meta.recipeBookUpgradedFrom) {
      var settled = S.clone(state.db);
      delete settled.meta.recipeBookUpgradedFrom;
      S.save(settled);
      state.db = settled;
      toast('菜谱库已更新（湘菜 + 家常菜各 20 道），库存与记录未改动；旧数据可在设置里回滚');
    }
    applyTheme();
    render();
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.querySelector('.modal-mask')) { closeModal(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('[data-action][role="button"]')) {
        e.preventDefault(); e.target.click();
      }
    });
    if (global.matchMedia) {
      var mq = global.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', function () { if (state.db.meta.theme === 'system') applyTheme(); });
    }
    global.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); state.deferredPrompt = e;
      if (state.view === 'settings') render(true);
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.warn('[饮食库] Service Worker 注册失败', err);
      });
      var reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloaded) return; reloaded = true; location.reload();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
