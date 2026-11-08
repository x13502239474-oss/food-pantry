/* 饮食库 · 示例数据装配器
 * ---------------------------------------------------------------
 * 菜谱与食材目录来自 js/recipe-book.js（纯数据文件，改那边即可随时更新）。
 * 本文件只负责：把菜谱书装配成 Ingredient / Recipe，再补上演示用的
 * 做饭记录、采购清单、剩菜，以及分类 / 单位 / 偏好等元数据。
 * 全部为示例假数据，不含任何真实家庭信息。
 */
(function (global) {
  'use strict';
  var FP = global.FP = global.FP || {};

  function build(today) {
    var book = FP.RecipeBook;
    if (!book) throw new Error('缺少 js/recipe-book.js，请检查脚本加载顺序');
    var assembled = book.assemble(today, null);
    var now = new Date().toISOString();

    function T(base, n, hh, mm) {
      var b = base ? new Date(base) : new Date();
      if (isNaN(b.getTime())) b = new Date();
      return new Date(b.getFullYear(), b.getMonth(), b.getDate() + n, hh, mm, 0).toISOString();
    }

    var categories = [
      { id:'cat_veg',    name:'蔬菜',     sortOrder:1 },
      { id:'cat_meat',   name:'肉蛋',     sortOrder:2 },
      { id:'cat_staple', name:'主食谷物', sortOrder:3 },
      { id:'cat_dairy',  name:'乳品豆制', sortOrder:4 },
      { id:'cat_frozen', name:'冷冻',     sortOrder:5 },
      { id:'cat_cond',   name:'调味',     sortOrder:6 },
      { id:'cat_fruit',  name:'水果',     sortOrder:7 },
      { id:'cat_drink',  name:'饮品',     sortOrder:8 },
      { id:'cat_other',  name:'未分类',   sortOrder:9 }
    ];
    var units = [
      { id:'u_pcs',name:'个',sortOrder:1 }, { id:'u_g',name:'克',sortOrder:2 },
      { id:'u_kg',name:'千克',sortOrder:3 }, { id:'u_box',name:'盒',sortOrder:4 },
      { id:'u_bag',name:'袋',sortOrder:5 }, { id:'u_bottle',name:'瓶',sortOrder:6 },
      { id:'u_bunch',name:'把',sortOrder:7 }, { id:'u_root',name:'根',sortOrder:8 },
      { id:'u_head',name:'头',sortOrder:9 }, { id:'u_spoon',name:'勺',sortOrder:10 }
    ];

    /* 演示用做饭记录（菜谱 id 与菜谱书保持一致） */
    var cookLogs = [
      { id:'cl_1', recipeId:'r_egg_noodle', cookedAt:T(today,-1,19,10), servings:2, note:'多加了一勺生抽',
        deductions:[{ingredientId:'ing_noodle',quantity:1,unit:'袋'},{ingredientId:'ing_egg',quantity:2,unit:'个'}] },
      { id:'cl_2', recipeId:'r_tomato_egg', cookedAt:T(today,-12,18,30), servings:2, note:'',
        deductions:[{ingredientId:'ing_tomato',quantity:2,unit:'个'},{ingredientId:'ing_egg',quantity:3,unit:'个'}] },
      { id:'cl_3', recipeId:'r_chicken_broccoli', cookedAt:T(today,-30,12,15), servings:1, note:'健身餐',
        deductions:[{ingredientId:'ing_chicken',quantity:200,unit:'克'}] },
      { id:'cl_4', recipeId:'r_fried_rice', cookedAt:T(today,-6,20,0), servings:2, note:'用了隔夜饭',
        deductions:[{ingredientId:'ing_rice',quantity:0.3,unit:'千克'}] },
      { id:'cl_5', recipeId:'r_chili_pork', cookedAt:T(today,-9,18,30), servings:2, note:'多放了一勺豆豉，很香',
        deductions:[{ingredientId:'ing_qingjiao',quantity:3,unit:'个'},{ingredientId:'ing_wuhuarou',quantity:150,unit:'克'}] },
      { id:'cl_6', recipeId:'r_xiaochao_beef', cookedAt:T(today,-14,19,0), servings:2, note:'小米辣放多了',
        deductions:[{ingredientId:'ing_beef',quantity:200,unit:'克'}] },
      { id:'cl_7', recipeId:'r_hongshao_rou', cookedAt:T(today,-25,18,0), servings:3, note:'家里来客，做了三份',
        deductions:[{ingredientId:'ing_wuhuarou',quantity:300,unit:'克'}] }
    ];

    var shoppingItems = [
      { id:'sh_1', name:'牛奶',   quantity:1, unit:'盒', done:false, source:'手动',              createdAt:T(today,-2,9,0) },
      { id:'sh_2', name:'吐司',   quantity:1, unit:'袋', done:false, source:'手动',              createdAt:T(today,-2,9,0) },
      { id:'sh_3', name:'蚝油',   quantity:1, unit:'瓶', done:true,  source:'手动',              createdAt:T(today,-3,9,0) },
      { id:'sh_4', name:'食盐',   quantity:1, unit:'袋', done:false, source:'低库存',            createdAt:T(today,-1,9,0) },
      { id:'sh_5', name:'西兰花', quantity:1, unit:'个', done:true,  source:'缺料:西兰花炒鸡胸', createdAt:T(today,-4,9,0) },
      { id:'sh_6', name:'芝士片', quantity:1, unit:'袋', done:false, source:'手动',              createdAt:T(today,0,9,0) },
      { id:'sh_7', name:'剁椒',   quantity:1, unit:'瓶', done:false, source:'手动',              createdAt:T(today,-1,9,0) },
      { id:'sh_8', name:'小米辣', quantity:1, unit:'把', done:false, source:'低库存',            createdAt:T(today,-1,9,0) },
      { id:'sh_9', name:'鱼头',   quantity:1, unit:'个', done:false, source:'缺料:剁椒鱼头',     createdAt:T(today,0,9,0) }
    ];

    var leftovers = [
      { id:'lf_1', recipeId:'r_tomato_egg', cookedAt:T(today,-1,19,10), expiresAt:T(today,1,19,10),  note:'冷藏，密封盒', status:'active' },
      { id:'lf_2', recipeId:'r_fried_rice', cookedAt:T(today,-2,20,0),  expiresAt:T(today,0,20,0),   note:'今天把它吃掉', status:'active' },
      { id:'lf_3', recipeId:'r_chili_pork', cookedAt:T(today,-4,18,40), expiresAt:T(today,-1,18,40), note:'忘了吃，示例', status:'active' }
    ];

    return {
      schemaVersion: 1,
      app: '饮食库',
      format: 'foodpantry-full',
      exportedAt: now,
      meta: {
        createdAt: now,
        expiryWindowDays: 3,
        defaultServings: 2,
        leftoverDays: 3,
        lowStockThreshold: 1,
        theme: 'light',
        recipeFocus: book.FOCUS,
        seedVersion: 3,
        recipeBookVersion: book.VERSION,
        note: '示例假数据'
      },
      categories: categories,
      units: units,
      ingredients: assembled.ingredients,
      recipes: assembled.recipes,
      cookLogs: cookLogs,
      shoppingItems: shoppingItems,
      leftovers: leftovers
    };
  }

  FP.Seed = { build: build };
})(typeof window !== 'undefined' ? window : globalThis);
