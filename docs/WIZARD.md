# 紫袍巫師：骨架、布料與完整動作

這個分支保存紫袍巫師的可執行原型、檢查工具與透明動畫素材。
沿用原 pixelfx 骨架與骨長；兜帽內全暗，不畫臉與眼睛，不持手杖。
彎曲尖帽、帽簷與金色帽帶跟隨 head；軀幹和袖子依各自骨頭變形。

## 動畫素材

素材在 `assets/wizard/`，均為 12 fps、48 幀、4 秒。

| 圖集 | 單格 | 腳底原點 | 播放 |
|---|---|---|---|
| wizard-idle | 64×64 | (30,54) | 循環 |
| wizard-cast-body | 64×64 | (30,54) | 單次，無特效角色 |
| wizard-spell-fx | 128×80 | (40,61) | 單次，獨立特效 |
| wizard-cast-full | 128×80 | (40,61) | 單次，角色含特效 |

每組都有 PNG 與 Aseprite 風格 JSON（8 欄、6 列），內含精確幀時長與原點。
不同格大小只是為了容納飛行魔法彈，角色像素尺寸相同。
GIF 是放大重播的預覽，PNG/JSON 為遊戲匯入素材。

施法：0～0.5 秒準備，0.5～1.75 秒聚能，**第 21 幀（從 0 起算）施放**，
2.1～3.5 秒收招，之後回到站姿。遊戲動畫控制器應設定施法播放一次後切回 idle。

## 執行與重現

```sh
npm run wizard:build
npm run wizard:check
npm run wizard:export
python tools/wizard/render-actions.py
```

Node.js >=18，核心無第三方依賴；PNG/GIF 輸出需要 Python Pillow。
工具會優先使用 Segoe UI 或 DejaVu Sans，找不到則使用 Pillow 預設字型。

布料走跑停止示範：

```sh
node tools/wizard/export-cloth.mjs
python tools/wizard/render-cloth.py
```

正常預覽只比較剛性跟隨與布料物理，均保持紫袍金邊。
`--debug-mesh` 才輸出有藍綠檢查線的 DEBUG MESH OVERLAY，不是服裝材質。

## 動態角色 API

```js
import { createWizardCharacter } from 'pixelfx/core/rig-wizard';

const wizard = createWizardCharacter({
  wind: [11, 0, 4], gravity: 70, damping: 3.8,
  iterations: 12, floor: 1.65,
});
wizard.update(dt, pose); // dt：秒，pose 欄位沿用原骨架
const pixels = wizard.pixels(); // xs、ys、color，格式同原 posed()
```

也可用 `wizard.update(dt, time => poseAt(time))` 於固定 120 Hz 取樣；
同一時間函數在不同顯示幀率下可得到一致的模擬結果。
`pose.x/y` 為世界位移，用來計算布料慣性；像素輸出仍以角色腳底為局部原點。
wind 可傳回三軸加速度的時間函數，reset(pose) 可在傳送後清除舊慣性。
一次 update 最多接受 0.1 秒，避免背景視窗恢復時爆算。

靜態 posed() 不推進布料；請以 createWizardCharacter 的 update/pixels 使用物理。
現有 createAct 與圖庫沒有自動切換角色，接入遊戲時需由角色更新迴圈驅動此實例。

## 布料與綁定

腰部 16 點固定於骨盆，其餘袍裙自由運動；共 160 頂點、880 條 XPBD 結構／剪切／彎曲約束。
包含重力、風力、慣性、阻尼、腿部膠囊碰撞、地面投影與接觸摩擦。
下襬不再直接綁定小腿，另有適合長袍的小步幅走跑測試動作。
手套和靴子保留原骨架部位，衣服內的原人偶表面隱藏。

這是簡化布料原型：碰撞針對頂點，尚無自碰撞、布面間碰撞或精細褶皺。
布料有彈性，示範最大結構邊伸長約 30%；極端跨步、深蹲與急轉仍需進一步調整。
新增衣服尚未建立身體狀態特效專用的 src 映射。

## 驗證

- 八組姿勢與額外 120 個狀態，檢查骨長、原版關節一致、權重、帽子與腰帶剛性綁定。
- 30／60／120 fps 相同時間取樣得到一致布料位置。
- 六秒走跑停止測試，腰部固定點誤差為零，頂點未進入腿部膠囊或地面。
- 風力回應、阻尼回穩、實例隔離與重複渲染檢查。
- 待機下一週期端點與首幀像素一致；GIF 解碼後 RGBA 與來源畫格一致。

`rig-wizard.js` 由原 `rig.js` 加入服裝渲染接點生成，原骨架求解器不變。
來源基底為 feat/falling-boulder-meteor-ice 的 302568a1b19a1fffcac38dba8ae2db77fb0d90c7。
