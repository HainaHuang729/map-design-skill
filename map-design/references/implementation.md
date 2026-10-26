# 实现约定

## 地点数据

一个可用的数据模型：

```js
{
  id: 'city-landmark',         // 稳定ID，更新名称时保持不变
  name: '正式名称',
  label: '短标签',
  group: 'scenery',
  region: 'central',
  blurb: '一段简短介绍',
  lng: 120.0,
  lat: 30.0,
  coordinateSystem: 'WGS84',
  locationKind: 'representative', // 或 verified-entrance
  displayRank: 10,             // 越小越优先，编辑配置
  sourceName: '内容来源',
  sourceUrl: 'https://example.org/place',
  coordinateSource: '坐标来源与核对方法',
  coordinateCheckedAt: 'YYYY-MM-DD',
  mapQuery: '城市 正式名称'
}
```

字段按现有项目适配；经纬度和来源不是占位值。地点数、类别名、片区、优先级和实际数据要为目标城市重新建立。

OSM等常见全球矢量底图的应用输入通常为WGS84经纬度。高德等来源可能采用GCJ-02；转换或选择外部名称搜索入口，并保留坐标来源。大景区、道路、村落和馆群的代表位置不能描述成已验证入口。

## 地标优先避让

1. 得到当前分类与片区筛选后的完整候选列表。
2. 当前选中的候选最优先，其余按 `displayRank` 和稳定ID排序。
3. 使用地图当前投影，将经纬度变成CSS像素坐标。
4. 按优先级遍历；如果与任何已保留标记小于避让距离，收起本点，否则保留在原经纬度。
5. 缩放结束、平移结束、视口尺寸变化或筛选改变后重算。

[select-visible-places.mjs](../assets/select-visible-places.mjs) 是可拷贝的通用实现，衍生自原项目MIT代码，许可随附于 [SOURCE-LICENSE.txt](../assets/SOURCE-LICENSE.txt)。杭州案例以64 CSS像素作为起点。根据图标、标签、目标设备和密度调整，不换成固定经纬度半径。这样放大时屏幕距离变大，次要地点自然出现。

```js
import { selectVisiblePlaces } from './select-visible-places.mjs';
const display = selectVisiblePlaces(
  filteredPlaces,
  lngLat => map.project(lngLat),
  {selectedId, minDistance: 64}
);
```

这是一种按优先级保留邻近标记的规则，不必先构造连通簇。A收起B，不意味着B能再收起离A足够远的C。不要挪动标记位置，不要用收起后的列表作为搜索或数据源。

纯函数示例适合少量精选点位。数据规模显著增加时，可使用屏幕空间索引优化邻近查找，同时保持相同的优先级语义。

## 标签与状态

- 标签同样按 `displayRank` 排序。为每个标签尝试下、右、左、上四个位置，避开已排标签、所有图标、视口边缘和浮动控件。
- 平移过程中可以用动画帧更新标签，避免每个地图事件都同步测量所有DOM；移动结束后再重算标记集合。
- 搜索使用完整地点列表。跨片区或分类选点时先清理不兼容筛选，再把选中地点加入显示优先级。
- 关闭气泡后清理选中状态并重算标记；搜索选中一个原本被收起的点后，气泡和标记应一致。
- 清理旧搜索词，避免界面看起来仍处于上一个地点的搜索状态。
- 收藏按稳定ID存储。迁移保留未知旧ID，不因暂时未显示或新清单未包含而覆盖删除用户收藏。
- 分享链接使用当前路径构造，例如 `new URL(location.href)`，保留项目子目录。旧参数与存储键只在同一项目迁移时兼容，新城市使用自己的命名。

## 底图、范围与部署适配

真实地图使用匹配来源架构的水面、林地、道路和建筑层。对未知来源先检查其图层字段，不照搬OpenMapTiles的source-layer名称到其他服务。

首页范围由核心游览地点计算；远郊通过片区、搜索、查看全部到达。根据手机上的全部点范围和控件占用设置最小缩放，确保远郊能看见；不要把杭州的固定中心、缩放或边界移到其他城市。

沿用项目现有地图引擎与依赖管理。若复用杭州的MapLibre独立worker方式，使用相对模块路径，例如 `new URL('./vendor/maplibre-gl-worker.mjs', import.meta.url)`，并验证托管目录中的worker返回正常。

公开部署到GitHub Pages等项目子路径时，检查模块、样式、图片、worker、旧链接跳转和canonical地址。保留地图署名及第三方资源许可。设计skill不固定托管平台，不创建或修改访问权限。
