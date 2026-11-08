/* 饮食库 · 菜谱书（纯数据 + 装配器）
 * ===============================================================
 * 这是「随时可以更新」的唯一入口：想加菜 / 改菜 / 换一批菜，只改本文件即可，
 * 不用碰 seed.js、store.js、app.js 的逻辑代码。
 *
 * 更新步骤：
 *   1. 在 CATALOG 里补食材（或直接写菜谱里的新食材名，会自动补建食材）
 *   2. 在 RECIPES 里加一行 R(...)，或编辑现有行
 *   3. 把 VERSION 加 1
 * 老设备下次打开会自动增量更新菜谱：库存数量、采购清单、做饭记录、
 * 剩菜、用户自建/改过的菜谱全部保留（旧数据会先自动备份）。
 *
 * 也可以在应用内「设置 → 菜谱库」导入/导出菜谱库 JSON 来批量更新。
 * 所有内容均为示例假数据，不含任何真实家庭信息。
 */
(function (global) {
  'use strict';
  var FP = global.FP = global.FP || {};

  var VERSION = 3;
  var FOCUS = '湘菜 + 家常菜';

  /* 食材目录：id 稳定不变，菜谱里用「名称」引用，便于手工维护。
   * I(id, 名称, 分类, 单位, 初始库存, 距今天到期天数|null, 存放位置, 备注) */
  function I(id, name, category, unit, quantity, days, location, note) {
    return { id:id, name:name, category:category, unit:unit, quantity:quantity,
             days:days, location:location, note:note || '' };
  }
  var CATALOG = [
    /* --- 通用 --- */
    I('ing_tomato','番茄','蔬菜','个',4,1,'冷藏','快熟了，优先用'),
    I('ing_egg','鸡蛋','肉蛋','个',8,9,'冷藏',''),
    I('ing_scallion','小葱','蔬菜','把',1,2,'冷藏','临期'),
    I('ing_potato','土豆','蔬菜','个',5,14,'常温',''),
    I('ing_onion','洋葱','蔬菜','个',3,20,'常温',''),
    I('ing_chicken','鸡胸肉','肉蛋','克',350,2,'冷藏','临期，今晚做掉'),
    I('ing_rice','大米','主食谷物','千克',2.5,180,'常温',''),
    I('ing_noodle','挂面','主食谷物','袋',2,120,'常温',''),
    I('ing_milk','牛奶','乳品豆制','盒',3,4,'冷藏',''),
    I('ing_tofu','嫩豆腐','乳品豆制','盒',2,1,'冷藏','临期'),
    I('ing_pork','猪肉末','肉蛋','克',200,-1,'冷冻','已过期示例，别真吃'),
    I('ing_soy','生抽','调味','瓶',1,365,'常温',''),
    I('ing_salt','食盐','调味','袋',1,365,'常温',''),
    I('ing_oil','食用油','调味','瓶',1,200,'常温',''),
    I('ing_garlic','大蒜','调味','头',1,30,'常温',''),
    I('ing_broccoli','西兰花','蔬菜','个',2,5,'冷藏',''),
    I('ing_shrimp','虾仁','冷冻','袋',1,60,'冷冻',''),
    I('ing_carrot','胡萝卜','蔬菜','根',3,8,'冷藏',''),
    I('ing_flour','面粉','主食谷物','袋',1,150,'常温',''),
    I('ing_cheese','芝士片','乳品豆制','袋',1,3,'冷藏','临期'),
    I('ing_bread','吐司','主食谷物','袋',0,6,'常温','库存为 0，用来演示缺料'),
    /* --- 湘味 --- */
    I('ing_qingjiao','青椒','蔬菜','个',6,2,'冷藏','临期，螺丝椒更香'),
    I('ing_xiaomila','小米辣','蔬菜','把',1,3,'冷藏','临期'),
    I('ing_yutou','鱼头','肉蛋','个',1,1,'冷藏','临期，今天蒸掉'),
    I('ing_beef','黄牛肉','肉蛋','克',300,2,'冷藏','临期，小炒用'),
    I('ing_wuhuarou','五花肉','肉蛋','克',400,6,'冷藏',''),
    I('ing_qiezi','茄子','蔬菜','个',3,3,'冷藏','临期'),
    I('ing_xianggu','香菇','蔬菜','盒',1,4,'冷藏',''),
    I('ing_caogu','茶树菇','蔬菜','袋',1,4,'冷藏',''),
    I('ing_suandoujiao','酸豆角','蔬菜','袋',2,20,'冷藏',''),
    I('ing_jiang','生姜','蔬菜','个',2,15,'常温',''),
    I('ing_pidan','皮蛋','肉蛋','个',4,30,'常温',''),
    I('ing_duojiao','剁椒','调味','瓶',1,90,'冷藏','湘菜灵魂'),
    I('ing_douchi','豆豉','调味','袋',1,180,'常温',''),
    I('ing_waipocai','外婆菜','调味','袋',1,60,'常温',''),
    I('ing_sugar','白糖','调味','袋',1,300,'常温',''),
    I('ing_larou','腊肉','肉蛋','克',300,60,'冷藏',''),
    I('ing_taro','芋头','蔬菜','个',4,20,'常温',''),
    I('ing_baocai','包菜','蔬菜','个',1,7,'冷藏',''),
    I('ing_huacai','花菜','蔬菜','个',1,5,'冷藏',''),
    I('ing_xianggan','香干','乳品豆制','袋',1,4,'冷藏',''),
    I('ing_oujian','藕尖','蔬菜','袋',1,5,'冷藏',''),
    I('ing_zhugan','猪肝','肉蛋','克',250,1,'冷藏','临期'),
    I('ing_yukuai','鱼块','肉蛋','克',300,2,'冷藏',''),
    I('ing_zisu','紫苏','蔬菜','把',1,3,'冷藏',''),
    I('ing_huanggua','黄瓜','蔬菜','根',2,6,'冷藏',''),
    I('ing_jichi','鸡翅','肉蛋','个',8,5,'冷藏',''),
    I('ing_paigu','排骨','肉蛋','克',400,4,'冷藏',''),
    I('ing_kele','可乐','饮品','瓶',1,180,'常温',''),
    I('ing_suantai','蒜薹','蔬菜','把',1,5,'冷藏',''),
    I('ing_shangqing','上海青','蔬菜','把',2,3,'冷藏',''),
    I('ing_jiucai','韭菜','蔬菜','把',1,3,'冷藏',''),
    I('ing_muer','木耳','蔬菜','袋',1,120,'常温',''),
    I('ing_donggua','冬瓜','蔬菜','个',1,10,'常温',''),
    I('ing_xiangcu','香醋','调味','瓶',1,300,'常温',''),
    I('ing_haoyou','蚝油','调味','瓶',1,200,'常温','')
  ];

  /* 菜谱：R(id, 标题, 份数, 标签, 上次做距今几天|null, 食材[[名,量,单位]], 步骤[])
   * 标签里写「湘菜」或「家常」即会被推荐与列表优先展示。 */
  function R(id, title, servings, tags, lastCookedDays, ingredients, steps) {
    return {
      id:id, title:title, servings:servings, tags:tags, lastCookedDays:lastCookedDays,
      ingredients:ingredients.map(function (x) { return { name:x[0], quantity:x[1], unit:x[2] }; }),
      steps:steps
    };
  }
  var RECIPES = [
    /* ==================== 湘菜 20 道 ==================== */
    R('r_chili_pork','辣椒炒肉',2,['湘菜','家常','下饭','快手'],9,
      [['青椒',3,'个'],['五花肉',150,'克'],['大蒜',0.5,'头'],['豆豉',1,'勺'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['青椒切滚刀块，五花肉切薄片，大蒜切片。','热锅少油煸五花肉至出油、边缘微焦。','拨到一边，下蒜片和豆豉爆香。','转大火下青椒压炒至虎皮起皱，淋生抽翻匀立刻出锅。']),
    R('r_duojiao_fish','剁椒鱼头',2,['湘菜','蒸菜','下饭'],null,
      [['鱼头',1,'个'],['剁椒',2,'勺'],['生姜',1,'个'],['小葱',0.5,'把'],['生抽',1,'勺']],
      ['鱼头洗净剖开抹盐，盘底铺姜片。','剁椒厚厚铺在鱼头上。','水开后大火蒸 12 分钟。','倒掉盘中腥水，淋生抽、撒葱末，浇一勺热油。']),
    R('r_xiaochao_beef','小炒黄牛肉',2,['湘菜','下饭','快手'],14,
      [['黄牛肉',200,'克'],['青椒',2,'个'],['小米辣',0.5,'把'],['大蒜',0.5,'头'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['牛肉逆纹切薄片，用生抽抓匀腌 10 分钟。','青椒切圈，小米辣切段，蒜切片。','锅烧到冒烟，下牛肉滑炒 20 秒盛出。','爆香蒜、小米辣、青椒，倒回牛肉大火翻匀 10 秒出锅。']),
    R('r_suandoujiao_pork','酸豆角肉末',2,['湘菜','下饭','快手'],null,
      [['酸豆角',1,'袋'],['猪肉末',100,'克'],['小米辣',0.5,'把'],['大蒜',0.5,'头'],['生抽',1,'勺']],
      ['酸豆角冲洗切碎，挤干水分。','肉末炒散至微焦出油。','加蒜末、小米辣炒香。','下酸豆角大火翻炒 2 分钟，淋生抽翻匀。']),
    R('r_leijiao_pidan','擂辣椒皮蛋',2,['湘菜','凉菜','下饭'],20,
      [['青椒',3,'个'],['皮蛋',2,'个'],['大蒜',0.5,'头'],['生抽',1,'勺'],['食盐',1,'勺']],
      ['青椒烤或干锅煸到虎皮，撕去黑皮。','皮蛋切瓣，蒜切末。','全部放擂钵里擂碎。','加生抽和盐拌匀，静置 5 分钟入味。']),
    R('r_waipocai_egg','外婆菜炒蛋',2,['湘菜','家常','下饭','快手'],11,
      [['外婆菜',1,'袋'],['鸡蛋',3,'个'],['小葱',0.5,'把'],['食用油',1,'勺']],
      ['鸡蛋打散，外婆菜切碎，小葱切末。','热油炒蛋，凝固后划散盛出。','下外婆菜中火炒香炒干。','倒回鸡蛋翻匀，撒葱末出锅。']),
    R('r_hongshao_rou','毛氏红烧肉',2,['湘菜','硬菜','下饭'],25,
      [['五花肉',300,'克'],['生姜',1,'个'],['生抽',1,'勺'],['白糖',1,'勺'],['食盐',1,'勺']],
      ['五花肉切块，冷水下锅焯去血沫。','少油炒白糖到枣红，下肉块裹糖色。','加姜片、生抽和没过肉的热水。','小火炖 45 分钟，大火收汁补盐。']),
    R('r_ganguo_caogu','干锅茶树菇',2,['湘菜','干锅','下饭'],null,
      [['茶树菇',1,'袋'],['五花肉',100,'克'],['青椒',1,'个'],['大蒜',0.5,'头'],['豆豉',1,'勺'],['生抽',1,'勺']],
      ['茶树菇去根洗净，焯水 1 分钟沥干。','五花肉薄片煸出油，下蒜片豆豉炒香。','加青椒圈和茶树菇大火翻炒。','淋生抽，收到干香无汤汁，连锅上桌。']),
    R('r_duojiao_tofu','剁椒蒸豆腐',2,['湘菜','蒸菜','快手','素'],7,
      [['嫩豆腐',2,'盒'],['剁椒',1,'勺'],['小葱',0.5,'把'],['生抽',1,'勺']],
      ['嫩豆腐切片码盘，吸掉表面水。','剁椒均匀铺上。','水开后大火蒸 8 分钟。','倒掉盘中水，淋生抽、撒葱末，浇热油。']),
    R('r_nongjia_yiwanxiang','农家一碗香',2,['湘菜','家常','下饭'],null,
      [['五花肉',120,'克'],['青椒',2,'个'],['鸡蛋',2,'个'],['豆豉',1,'勺'],['生抽',1,'勺']],
      ['五花肉切片，青椒切块，鸡蛋煎成荷包蛋切块。','肉片煸出油，下豆豉炒香。','加青椒炒到虎皮。','倒回鸡蛋块，淋生抽大火翻匀。']),
    R('r_dongan_chicken','东安子鸡',2,['湘菜','下饭','硬菜'],null,
      [['鸡胸肉',250,'克'],['生姜',1,'个'],['小米辣',0.5,'把'],['香醋',1,'勺'],['生抽',1,'勺']],
      ['鸡肉切条，冷水下锅加姜片煮 8 分钟捞出。','姜切丝，小米辣切段。','热油爆香姜丝和小米辣。','下鸡条，沿锅边淋香醋，加生抽翻匀收汁。']),
    R('r_lawei_hezheng','腊味合蒸',2,['湘菜','蒸菜','硬菜'],null,
      [['腊肉',200,'克'],['剁椒',1,'勺'],['生姜',1,'个'],['小葱',0.5,'把']],
      ['腊肉温水洗净，切厚片码碗。','铺姜丝和剁椒。','水开后中火蒸 20 分钟。','出锅撒葱末，倒扣装盘。']),
    R('r_duojiao_taro','剁椒蒸芋头',2,['湘菜','蒸菜','素'],null,
      [['芋头',3,'个'],['剁椒',2,'勺'],['小葱',0.5,'把'],['生抽',1,'勺']],
      ['芋头去皮切滚刀块，铺盘。','剁椒加少许油拌匀铺上。','水开后大火蒸 15 分钟至软糯。','淋生抽，撒葱末。']),
    R('r_shousi_baocai','手撕包菜',2,['湘菜','家常','快手','素'],null,
      [['包菜',1,'个'],['大蒜',0.5,'头'],['香醋',1,'勺'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['包菜用手撕成大片，洗净沥干。','热油爆香蒜片。','大火下包菜快炒到边缘微焦。','沿锅边淋香醋，加生抽翻匀出锅。']),
    R('r_ganguo_huacai','干锅花菜',2,['湘菜','干锅','下饭'],null,
      [['花菜',1,'个'],['五花肉',100,'克'],['青椒',1,'个'],['大蒜',0.5,'头'],['豆豉',1,'勺'],['生抽',1,'勺']],
      ['花菜掰小朵，焯水 30 秒沥干。','五花肉煸出油，下蒜片豆豉炒香。','加花菜中火煸到微焦。','加青椒圈和生抽，收到干香。']),
    R('r_xianggan_rou','攸县香干炒肉',2,['湘菜','下饭','快手'],null,
      [['香干',1,'袋'],['五花肉',100,'克'],['青椒',2,'个'],['大蒜',0.5,'头'],['生抽',1,'勺']],
      ['香干切条，五花肉切片，青椒切圈。','肉片煸出油，下蒜片爆香。','加香干和青椒大火翻炒。','淋生抽翻匀出锅。']),
    R('r_suanla_oujian','酸辣藕尖',2,['湘菜','快手','素'],null,
      [['藕尖',1,'袋'],['小米辣',0.5,'把'],['大蒜',0.5,'头'],['香醋',1,'勺'],['食盐',1,'勺']],
      ['藕尖洗净切段，焯水 30 秒。','热油爆香蒜末和小米辣。','下藕尖大火快炒。','淋香醋、加盐翻匀，保持脆爽。']),
    R('r_xiaochao_zhugan','小炒猪肝',2,['湘菜','下饭','快手'],null,
      [['猪肝',200,'克'],['青椒',2,'个'],['小米辣',0.5,'把'],['生姜',1,'个'],['生抽',1,'勺']],
      ['猪肝切薄片，清水泡去血水，沥干抓匀。','姜切丝，青椒切块。','锅烧到冒烟，猪肝滑炒 15 秒盛出。','爆香姜丝小米辣和青椒，倒回猪肝，淋生抽翻匀。']),
    R('r_hongshao_yukuai','湘味红烧鱼块',2,['湘菜','下饭','硬菜'],null,
      [['鱼块',300,'克'],['生姜',1,'个'],['小葱',0.5,'把'],['生抽',1,'勺'],['白糖',1,'勺']],
      ['鱼块擦干，热油两面煎到定型。','下姜片，加生抽、白糖和一碗热水。','中火烧 8 分钟，中途翻面一次。','大火收汁，撒葱末。']),
    R('r_zisu_huanggua','紫苏煎黄瓜',2,['湘菜','快手','素'],null,
      [['黄瓜',2,'根'],['紫苏',0.5,'把'],['大蒜',0.5,'头'],['食盐',1,'勺'],['食用油',1,'勺']],
      ['黄瓜切厚片，紫苏切碎，蒜切片。','热油把黄瓜两面煎到微黄。','下蒜片和紫苏炒香。','加盐翻匀出锅。']),

    /* ==================== 家常菜 20 道 ==================== */
    R('r_tomato_egg','番茄炒蛋',2,['家常','快手','素'],12,
      [['番茄',2,'个'],['鸡蛋',3,'个'],['小葱',0.5,'把'],['生抽',1,'勺'],['食用油',1,'勺'],['食盐',1,'勺']],
      ['番茄切块，鸡蛋加盐打散，小葱切末。','热油炒蛋，凝固划散盛出。','下番茄中火炒出汁。','加生抽和盐，倒回鸡蛋翻匀，撒葱末。']),
    R('r_potato_shred','醋溜土豆丝',2,['家常','快手','素'],4,
      [['土豆',2,'个'],['胡萝卜',1,'根'],['大蒜',0.5,'头'],['香醋',1,'勺'],['食盐',1,'勺'],['食用油',1,'勺']],
      ['土豆切细丝，清水泡 5 分钟去淀粉沥干。','胡萝卜切丝，蒜切片。','热油爆香蒜片，下土豆丝大火快炒。','加胡萝卜丝和盐，沿锅边淋香醋，断生出锅。']),
    R('r_qingjiao_rousi','青椒肉丝',2,['家常','下饭','快手'],6,
      [['青椒',2,'个'],['猪肉末',150,'克'],['大蒜',0.5,'头'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['青椒去籽切丝，肉切丝用生抽抓匀。','热油下肉丝滑炒至变色盛出。','爆香蒜片，下青椒丝炒到微塌。','倒回肉丝，淋生抽大火翻匀。']),
    R('r_garlic_broccoli','蒜蓉西兰花',2,['家常','快手','素'],3,
      [['西兰花',1,'个'],['大蒜',0.5,'头'],['食盐',1,'勺'],['食用油',1,'勺']],
      ['西兰花掰小朵，淡盐水泡 5 分钟。','沸水焯 1 分钟捞出过凉。','热油爆香蒜末。','下西兰花大火翻炒，加盐出锅。']),
    R('r_scallion_tofu','小葱拌豆腐',2,['家常','快手','凉菜','素'],null,
      [['嫩豆腐',1,'盒'],['小葱',0.5,'把'],['生抽',1,'勺'],['食盐',1,'勺']],
      ['嫩豆腐冲一下，切块装盘。','小葱切细末。','生抽加盐调匀淋上。','撒葱末，吃前拌匀。']),
    R('r_egg_noodle','葱油鸡蛋面',2,['家常','主食','快手'],1,
      [['挂面',1,'袋'],['鸡蛋',2,'个'],['小葱',0.5,'把'],['生抽',1,'勺']],
      ['挂面煮熟过凉水。','煎两个荷包蛋。','小葱切段，热油激香后加生抽。','面条拌入葱油汁，放上鸡蛋。']),
    R('r_carrot_egg','胡萝卜炒蛋',2,['家常','快手','素'],5,
      [['胡萝卜',2,'根'],['鸡蛋',3,'个'],['食盐',1,'勺'],['食用油',1,'勺']],
      ['胡萝卜切细丝，鸡蛋打散。','蛋液炒熟盛出。','胡萝卜丝炒软加盐。','倒回鸡蛋翻匀出锅。']),
    R('r_fried_rice','蛋炒饭',2,['家常','主食','快手','剩饭利用'],6,
      [['大米',0.3,'千克'],['鸡蛋',2,'个'],['小葱',0.5,'把'],['胡萝卜',1,'根'],['食盐',1,'勺']],
      ['隔夜饭抓散，胡萝卜切小丁。','蛋液炒散盛出。','胡萝卜丁炒软，下米饭压散炒热。','倒回鸡蛋，加盐和葱末翻匀。']),
    R('r_hongshao_qiezi','红烧茄子',2,['家常','下饭','素'],null,
      [['茄子',2,'个'],['青椒',1,'个'],['大蒜',0.5,'头'],['生抽',1,'勺'],['白糖',1,'勺'],['食用油',1,'勺']],
      ['茄子切滚刀块，撒盐静置 10 分钟挤干水。','热油煎到表面金黄。','加蒜末和青椒块炒香。','生抽、白糖加小半碗水调汁倒入，焖 5 分钟收汁。']),
    R('r_xianggu_chicken','香菇滑鸡',2,['家常','下饭','快手'],18,
      [['鸡胸肉',200,'克'],['香菇',1,'盒'],['生姜',1,'个'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['鸡胸切片，用生抽抓匀。','香菇切片，姜切丝。','热油下鸡片滑炒到变白盛出。','炒香姜丝香菇，倒回鸡片，淋生抽翻匀。']),
    R('r_mapo_tofu','家常豆腐煲',2,['家常','下饭'],16,
      [['嫩豆腐',2,'盒'],['猪肉末',100,'克'],['小葱',0.5,'把'],['生抽',1,'勺'],['大蒜',0.5,'头']],
      ['豆腐切块，淡盐水泡 5 分钟。','肉末和蒜末炒香。','加一碗水和生抽烧开，轻轻推入豆腐。','小火煮 5 分钟，撒葱末。']),
    R('r_chicken_broccoli','西兰花炒鸡胸',2,['家常','健康','快手'],30,
      [['鸡胸肉',200,'克'],['西兰花',1,'个'],['大蒜',0.5,'头'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['鸡胸切丁，用生抽抓匀腌 10 分钟。','西兰花掰小朵焯 1 分钟。','蒜末爆香，下鸡丁炒至变白。','倒入西兰花，加生抽翻匀。']),
    R('r_potato_pork','土豆肉末',2,['家常','下饭'],8,
      [['猪肉末',150,'克'],['土豆',2,'个'],['洋葱',0.5,'个'],['生抽',1,'勺']],
      ['土豆去皮切丁，洋葱切碎。','肉末炒散至变色。','加洋葱和土豆丁翻炒 2 分钟。','加小半碗水和生抽，焖 8 分钟收汁。']),
    R('r_shrimp_noodle','虾仁汤面',2,['家常','汤面','快手'],null,
      [['挂面',1,'袋'],['虾仁',1,'袋'],['小葱',0.5,'把'],['食盐',1,'勺']],
      ['水烧开，下挂面煮至八分熟。','放虾仁继续煮 2 分钟。','加盐调味，撒葱末。','连汤带面盛出。']),
    R('r_kele_jichi','可乐鸡翅',2,['家常','下饭','硬菜'],null,
      [['鸡翅',8,'个'],['可乐',1,'瓶'],['生姜',1,'个'],['生抽',1,'勺']],
      ['鸡翅两面划刀，焯水去腥。','热锅把鸡翅煎到两面金黄。','倒入可乐没过鸡翅，加姜片和生抽。','中火焖 15 分钟，大火收汁。']),
    R('r_tangcu_paigu','糖醋排骨',2,['家常','下饭','硬菜'],null,
      [['排骨',400,'克'],['香醋',2,'勺'],['白糖',2,'勺'],['生抽',1,'勺'],['生姜',1,'个']],
      ['排骨冷水下锅焯去血沫。','热油把排骨煎到微黄。','加姜片、生抽、白糖、香醋和热水。','小火焖 30 分钟，大火收汁到挂浆。']),
    R('r_tomato_egg_soup','西红柿鸡蛋汤',2,['家常','快手','汤'],null,
      [['番茄',2,'个'],['鸡蛋',2,'个'],['小葱',0.5,'把'],['食盐',1,'勺']],
      ['番茄切块，鸡蛋打散。','锅中少油炒番茄到出汁，加两碗水烧开。','慢慢淋入蛋液，边淋边搅出蛋花。','加盐，撒葱末。']),
    R('r_suantai_rou','蒜薹炒肉',2,['家常','下饭','快手'],null,
      [['蒜薹',1,'把'],['猪肉末',120,'克'],['生抽',1,'勺'],['食用油',1,'勺']],
      ['蒜薹切段，焯水 30 秒。','肉丝下锅炒散至变色。','加蒜薹大火翻炒 2 分钟。','淋生抽翻匀出锅。']),
    R('r_qingchao_shangqing','清炒上海青',2,['家常','快手','素'],null,
      [['上海青',2,'把'],['大蒜',0.5,'头'],['食盐',1,'勺'],['食用油',1,'勺']],
      ['上海青洗净，梗叶分开。','热油爆香蒜片。','先下菜梗炒 1 分钟，再下菜叶。','加盐，断生出锅。']),
    R('r_roumo_zhengdan','肉末蒸蛋',2,['家常','快手','蒸菜'],null,
      [['鸡蛋',3,'个'],['猪肉末',80,'克'],['小葱',0.5,'把'],['生抽',1,'勺']],
      ['鸡蛋加 1.5 倍温水打散，过筛倒入碗。','盖保鲜膜，水开后中火蒸 10 分钟。','肉末加生抽炒香。','把肉末铺在蛋羹上，撒葱末。']),
    /* ==================== 其他（缺料演示） ==================== */
    R('r_cheese_toast','芝士烤吐司',2,['早餐','快手'],null,
      [['吐司',1,'袋'],['芝士片',1,'袋'],['鸡蛋',1,'个']],
      ['吐司铺上芝士片。','烤箱 180℃ 烤 6 分钟至芝士融化。','同时煎一个蛋放在上面。'])
  ];

  /* ---------------- 装配器：菜谱书 → 应用数据 ---------------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nameHash(s) {
    var h = String(s).length + '_';
    for (var i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(36);
    return h.slice(0, 48);
  }

  /* assemble(today, baseIngredients, recipeList)
   * - baseIngredients 存在时：保留其库存数量 / 到期日 / 位置 / 备注，并保留用户自建食材
   * - recipeList 可传自定义菜谱（导入菜谱库时用），省略则用内置 RECIPES
   * - 菜谱里出现目录没有的食材名，会自动补建一个库存为 1 的食材，永远不会悬空引用
   */
  function assemble(today, baseIngredients, recipeList) {
    var base = today ? new Date(today) : new Date();
    if (isNaN(base.getTime())) base = new Date();
    var D = function (n) { return ymd(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n)); };
    var T = function (n, hh, mm) {
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n, hh, mm, 0).toISOString();
    };
    var now = new Date().toISOString();
    var byName = {}, byId = {}, ingredients = [], seen = {}, i;

    var existing = Array.isArray(baseIngredients) ? baseIngredients : [];
    for (i = 0; i < existing.length; i++) {
      var e = existing[i];
      byId[e.id] = e;
      if (!byName[e.name]) byName[e.name] = e.id;
    }

    for (i = 0; i < CATALOG.length; i++) {
      var c = CATALOG[i];
      var old = byId[c.id];
      if (!old) {
        for (var k = 0; k < existing.length; k++) if (existing[k].name === c.name) { old = existing[k]; break; }
      }
      var ing = old ? {
        id: old.id, name: old.name || c.name,
        category: old.category || c.category, unit: old.unit || c.unit,
        quantity: typeof old.quantity === 'number' ? old.quantity : c.quantity,
        expiresAt: old.expiresAt !== undefined ? old.expiresAt : (c.days == null ? null : D(c.days)),
        location: old.location !== undefined ? old.location : c.location,
        note: old.note !== undefined ? old.note : c.note,
        createdAt: old.createdAt || now, updatedAt: old.updatedAt || now
      } : {
        id: c.id, name: c.name, category: c.category, unit: c.unit, quantity: c.quantity,
        expiresAt: c.days == null ? null : D(c.days), location: c.location, note: c.note,
        createdAt: now, updatedAt: now
      };
      ingredients.push(ing);
      seen[ing.id] = true;
      byName[c.name] = ing.id;
    }
    // 用户自建食材：目录里没有的，原样保留
    for (i = 0; i < existing.length; i++) {
      if (!seen[existing[i].id]) {
        var extra = clone(existing[i]);
        ingredients.push(extra);
        seen[extra.id] = true;
        if (!byName[extra.name]) byName[extra.name] = extra.id;
      }
    }
    function ensure(name, unit) {
      if (byName[name]) return byName[name];
      var id = 'ing_auto_' + nameHash(name);
      byName[name] = id;
      ingredients.push({
        id:id, name:name, category:'未分类', unit:unit || '', quantity:1,
        expiresAt:null, location:'常温', note:'由菜谱自动补建，可在库存页调整',
        createdAt:now, updatedAt:now
      });
      return id;
    }
    var src = Array.isArray(recipeList) ? recipeList : RECIPES;
    var recipes = src.map(function (r) {
      return {
        id:String(r.id), title:String(r.title), servings:Number(r.servings) || 2,
        ingredients:(r.ingredients || []).map(function (ri) {
          var name = ri.name || ri[0], qty = ri.quantity != null ? ri.quantity : ri[1], unit = ri.unit || ri[2] || '';
          return { ingredientId:ensure(name, unit), quantity:Number(qty) || 0, unit:unit };
        }).filter(function (x) { return x.ingredientId; }),
        steps:Array.isArray(r.steps) ? r.steps.slice() : [],
        tags:Array.isArray(r.tags) ? r.tags.slice() : [],
        lastCookedAt:r.lastCookedDays == null ? null : T(-Number(r.lastCookedDays), 18, 30),
        createdAt:now, custom:false
      };
    });
    return { ingredients:ingredients, recipes:recipes };
  }

  /* 导出当前菜谱为「菜谱库」格式（可直接编辑后再导入） */
  function exportBook(db) {
    var byId = {};
    (db.ingredients || []).forEach(function (x) { byId[x.id] = x.name; });
    return {
      format:'foodpantry-recipe-book',
      version:VERSION,
      focus:(db.meta && db.meta.recipeFocus) || FOCUS,
      recipes:(db.recipes || []).map(function (r) {
        return {
          id:r.id, title:r.title, servings:r.servings, tags:r.tags.slice(),
          lastCookedDays:r.lastCookedAt
            ? Math.max(0, Math.round((Date.now() - new Date(r.lastCookedAt).getTime()) / 86400000)) : null,
          ingredients:r.ingredients.map(function (ri) {
            return { name:byId[ri.ingredientId] || '未知食材', quantity:ri.quantity, unit:ri.unit };
          }),
          steps:r.steps.slice()
        };
      })
    };
  }
  /* 解析外部菜谱库文件（JSON 或对象），做基本校验 */
  function parseBook(input) {
    var data = typeof input === 'string' ? JSON.parse(input) : input;
    if (!data || !Array.isArray(data.recipes)) throw new Error('不是有效的菜谱库文件（缺少 recipes 数组）');
    var seenIds = {}, recipes = data.recipes.map(function (r) {
      if (!r || !r.title) throw new Error('菜谱库里有缺少标题的菜谱');
      var id = String(r.id || ('r_' + nameHash(String(r.title))));
      if (seenIds[id]) throw new Error('菜谱 id 重复：' + id);
      seenIds[id] = true;
      return {
        id:id, title:String(r.title), servings:Number(r.servings) || 2,
        tags:Array.isArray(r.tags) ? r.tags.map(String) : [],
        lastCookedDays:r.lastCookedDays == null ? null : Number(r.lastCookedDays),
        ingredients:(r.ingredients || []).map(function (ri) {
          return {
            name:String(ri.name || ri[0] || ''),
            quantity:Number(ri.quantity != null ? ri.quantity : ri[1]) || 0,
            unit:String(ri.unit || ri[2] || '')
          };
        }).filter(function (x) { return x.name; }),
        steps:Array.isArray(r.steps) ? r.steps.map(String) : []
      };
    });
    return {
      format:'foodpantry-recipe-book',
      version:Number(data.version) || VERSION,
      focus:String(data.focus || FOCUS),
      recipes:recipes
    };
  }

  FP.RecipeBook = {
    VERSION:VERSION, FOCUS:FOCUS, CATALOG:CATALOG, RECIPES:RECIPES,
    assemble:assemble, exportBook:exportBook, parseBook:parseBook
  };
})(typeof window !== 'undefined' ? window : globalThis);
