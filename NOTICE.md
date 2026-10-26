# 来源与第三方许可

## 原创内容与代码

技能说明、参考文档、配色变量及标记选择示例由杭州慢游项目提炼，版权为 © 2026 HainaHuang729，采用仓库根目录的 [MIT License](LICENSE)。

`map-design/assets/select-visible-places.mjs` 衍生自 [杭州慢游](https://github.com/HainaHuang729/hangzhou-slow-walk) 的标记显示逻辑；目录中同时保留 [SOURCE-LICENSE.txt](map-design/assets/SOURCE-LICENSE.txt)。

设计参考快照对应杭州慢游提交 `d2c06811064f931b796a7f789dcb701026af02c1`，不代表应用的最新功能或数据清单。

## 地图截图

`hangzhou-desktop.png` 与 `hangzhou-mobile.png` 是杭州慢游界面截图，保留了地图署名。底图涉及：

- [OpenFreeMap](https://openfreemap.org/)：底图服务。
- [OpenMapTiles](https://openmaptiles.org/)：矢量地图体系。
- [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)：地理数据，采用 [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/)。

仓库的 MIT 许可不替代第三方地理数据许可。复用或展示截图时请保留相关地图署名；本仓库不分发底图瓦片数据库。

## 新增城市参考图与示例

`map-design/assets/cities/` 中的苏州、上海、成都、厦门桌面与手机截图，由 `examples/city-maps/` 的真实互动地图导出，保留 OpenFreeMap / OpenMapTiles / OpenStreetMap 署名。城市配色、界面与短介绍为原创设计。

`examples/city-maps/data.js` 的24个点位坐标派生自 OpenStreetMap，采用 ODbL 1.0，各点记录原始 OSM 对象链接与核对日期。地址匹配使用 [Nominatim](https://nominatim.openstreetmap.org/)，为制作参考图时的一次性查询；运行示例不再请求地理编码服务。坐标为WGS84代表位置，不保证是入口。

`examples/vendor/` 内的 MapLibre GL JS 运行时、worker及样式文件取自杭州慢游所使用的发行文件，保留 [完整第三方许可](examples/vendor/MAPLIBRE-LICENSE.txt)，包含 MapLibre、Mapbox、glfx.js 与 d3-color 的适用条款。仓库根目录 MIT 许可不替代这些条款。
