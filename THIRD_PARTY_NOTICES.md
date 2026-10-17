# 第三者ライセンス / Third-party notices

## world-atlas 2.0.2（index.html に埋め込んだ地図データ countries-50m.json）

地図の元データは Natural Earth（パブリックドメイン）です。TopoJSON 形式への変換・配布は world-atlas によるもので、以下のライセンスに従います。

```
Copyright 2013-2019 Michael Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

## index.html に埋め込んだ天体データ（`<script type="application/json" id="skydata">`）

### HYG Database v4.1（恒星）

- 作成者：David Nash（https://github.com/astronexus/HYG-Database ／ https://www.astronexus.com/hyg）
- ライセンス：Creative Commons Attribution-ShareAlike 4.0 International（CC BY-SA 4.0）https://creativecommons.org/licenses/by-sa/4.0/
- 改変の内容：次の条件の星だけを抜き出しました（8等級以下の明るさ、固有名がある、または50光年以内）。赤経・赤緯・距離・絶対等級・色指数を丸めて2進数に変換し、Base64で埋め込みました。固有名・バイエル符号・フラムスティード番号・HIP/HD番号・スペクトル型・光度の列を使っています。
- この改変したデータは、CC BY-SA 4.0 で提供します。

### OpenNGC（星雲・星団・銀河）

- 作成者：Mattia Verga（https://github.com/mattiaverga/OpenNGC）
- ライセンス：CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/
- 改変の内容：全天体の位置・種類・明るさ・赤方偏移・メシエ番号・通称・星座・大きさを抜き出しました。値を丸めて2進数に変換し、Base64で埋め込みました。種類は9区分にまとめています。
- この改変したデータは、CC BY-SA 4.0 で提供します。

### d3-celestial（星座線、星座・星・星雲の日本語名）

- https://github.com/ofrohn/d3-celestial
- 星座線をHYGの星に対応づけて埋め込みました。日本語名は、d3-celestialのデータに含まれる日本語表記を使っています。
- d3-celestial の README によると、星座名の多言語表記は Wikipedia、星の名前の翻訳は Stellarium の skycultures データに由来します。

```
Copyright (c) 2015, Olaf Frohn
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### NASA/JPL Solar System Dynamics（小天体・衛星）

- Small-Body Database（https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html）の軌道要素（2026年10月13日に取得し、3桁程度に丸めた値）
- Planetary Satellite Mean Elements（https://ssd.jpl.nasa.gov/sats/elem/）、NASA Planetary Fact Sheets（https://nssdc.gsfc.nasa.gov/planetary/factsheet/）の値の一部
- 出典として NASA/JPL を表示しています。

## CDNから読み込むライブラリ（同梱はしていません）

- three.js r128（MIT License）
- d3 7.8.5（ISC License）
- topojson 3.0.2（ISC License）
- satellite.js 6.0.2（MIT License, Copyright (C) 2013 Shashwat Kandadai, UCSC Jack Baskin School of Engineering）※5.0.0から更新。OMM（JSON）形式の軌道要素を読む json2satrec を使うため
- Google Fonts: Shippori Mincho B1 / Zen Kaku Gothic New / JetBrains Mono（SIL Open Font License 1.1）

## 実行時に取得する外部データと表示している出典

- 人工衛星の軌道要素：CelesTrak（https://celestrak.org/）
- 船舶位置：Source: Fintraffic / digitraffic.fi, license CC 4.0 BY（https://creativecommons.org/licenses/by/4.0/）。アプリ内では最終受信位置から速度と針路で現在位置を推定（改変）して表示しています
- 衛星画像：We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS).

## ライブカメラ（YouTube埋め込みプレーヤー）

映像は各配信者がYouTubeで公開しているライブ配信です。このアプリは、配信者が埋め込みを許可している配信を、YouTube公式の埋め込みプレーヤーで表示するだけです。映像を保存・再配信・加工はしていません。映像の権利は各配信者にあります。利用条件は YouTube 利用規約（https://www.youtube.com/t/terms）に従います。視聴ウィンドウを開くまで、YouTubeとは通信しません。

掲載は2026年10月17日時点の確認に基づきます。配信者の申し出や配信の終了があれば、掲載をやめます。

| 場所 | 国・地域 | 配信者（YouTube） | 動画 |
|---|---|---|---|
| 渋谷スクランブル交差点 | 日本 | FNNプライムオンライン | [dfVK7ld38Ys](https://www.youtube.com/watch?v=dfVK7ld38Ys) |
| 東京タワー | 日本 | 東京タワー公式チャンネル | [nu6NE55_X7A](https://www.youtube.com/watch?v=nu6NE55_X7A) |
| 浅草寺 宝蔵門 | 日本 | 浅草中屋チャンネル -ASAKUSA NAKAYA CHANNEL- | [NsFHt76uwh8](https://www.youtube.com/watch?v=NsFHt76uwh8) |
| 羽田空港 第1ターミナル | 日本 | TBS NEWS DIG Powered by JNN | [2f9NOSw-FqM](https://www.youtube.com/watch?v=2f9NOSw-FqM) |
| 成田空港 A滑走路 | 日本 | 朝日新聞LIVE | [OuCbntsMsWY](https://www.youtube.com/watch?v=OuCbntsMsWY) |
| 草津温泉 湯畑 | 日本 | 草津町公式YouTubeチャンネル | [GrEEoEmmrKs](https://www.youtube.com/watch?v=GrEEoEmmrKs) |
| 薩埵峠から望む富士山 | 日本 | 静岡市さったの峠 ライブカメラ | [CWNjN2bYzsA](https://www.youtube.com/watch?v=CWNjN2bYzsA) |
| 日本平夢テラス（富士山・駿河湾） | 日本 | 日本平夢テラスofficial | [VQB6sYDXQpo](https://www.youtube.com/watch?v=VQB6sYDXQpo) |
| 河口湖 富士山パノラマロープウェイ | 日本 | フジヤマNAVI | [Sv9hcJ3k5h4](https://www.youtube.com/watch?v=Sv9hcJ3k5h4) |
| 札幌市中心部 | 日本 | STV札幌テレビ放送 公式 | [z3OUPSoABJk](https://www.youtube.com/watch?v=z3OUPSoABJk) |
| 新千歳空港 | 日本 | STVニュース北海道 | [3SKn4LgGJk8](https://www.youtube.com/watch?v=3SKn4LgGJk8) |
| 函館山 | 日本 | ＦＭいるか | [s--MDmshT3I](https://www.youtube.com/watch?v=s--MDmshT3I) |
| 川湯温泉 | 日本 | お宿欣喜湯＆別邸忍冬（川湯温泉） | [9KVUU0LOYmY](https://www.youtube.com/watch?v=9KVUU0LOYmY) |
| 大阪城（天満橋から） | 日本 | 大阪NEWS【テレビ大阪ニュース】 | [dOKOq-jU1b8](https://www.youtube.com/watch?v=dOKOq-jU1b8) |
| 通天閣・あべのハルカス | 日本 | Osaka Ebisu Hotel | [6RrmTwhbbjk](https://www.youtube.com/watch?v=6RrmTwhbbjk) |
| 神戸港 メリケンパーク | 日本 | 神戸ウォーターフロント開発機構 | [AU_2zfM4m68](https://www.youtube.com/watch?v=AU_2zfM4m68) |
| 高野山 金剛峯寺 | 日本 | テレビ和歌山【公式】 | [XXVXVSLbjAk](https://www.youtube.com/watch?v=XXVXVSLbjAk) |
| 伏見稲荷大社 表参道 | 日本 | 京都観光混雑状況Live | [MMeBDRfRHyA](https://www.youtube.com/watch?v=MMeBDRfRHyA) |
| 平安神宮 | 日本 | 京都観光混雑状況Live | [iUbbYRWIEzo](https://www.youtube.com/watch?v=iUbbYRWIEzo) |
| 阿蘇山（草千里） | 日本 | RKK NEWS DIG | [aVGYOlIzV0A](https://www.youtube.com/watch?v=aVGYOlIzV0A) |
| 桜島 | 日本 | MBC南日本放送 | [Hmmk0eYn0cw](https://www.youtube.com/watch?v=Hmmk0eYn0cw) |
| 軍艦島（端島） | 日本 | 長崎ケーブルメディア[公式] | [pmdZ-D1XOJA](https://www.youtube.com/watch?v=pmdZ-D1XOJA) |
| 福岡空港 | 日本 | FBS福岡放送ニュース | [uI8tWGe_FtA](https://www.youtube.com/watch?v=uI8tWGe_FtA) |
| 那覇空港 | 日本 | 【琉球放送】RBC NEWS | [Yzl9offu5g8](https://www.youtube.com/watch?v=Yzl9offu5g8) |
| 宜野湾の海 | 日本 | Laguna Garden Hotel【Official】 | [o7i9-ZK0U6c](https://www.youtube.com/watch?v=o7i9-ZK0U6c) |
| 那覇 国際通り・県庁前 | 日本 | 琉球新報 | [j1nfkpuQDLQ](https://www.youtube.com/watch?v=j1nfkpuQDLQ) |
| 象山から望む台北101 | 台湾 | Taipei Travel Live Cam  台北觀光即時影像  | [z_fY1pj1VBw](https://www.youtube.com/watch?v=z_fY1pj1VBw) |
| 三仙台（台湾東海岸） | 台湾 | 東部海岸國家風景區管理處 | [dQ7Sd6PGLdA](https://www.youtube.com/watch?v=dQ7Sd6PGLdA) |
| 阿里山 牛埔仔草原 | 台湾 | 阿里山國家風景區管理處 | [hMYs60qtkK8](https://www.youtube.com/watch?v=hMYs60qtkK8) |
| 高雄 旗津海水浴場 | 台湾 | 高雄旅遊網 | [ka7FV0sCvxQ](https://www.youtube.com/watch?v=ka7FV0sCvxQ) |
| 小烏来スカイウォーク | 台湾 | 遊桃園 Taoyuan Travel | [neaiCec1kec](https://www.youtube.com/watch?v=neaiCec1kec) |
| ソウル 漢江・西江大橋 | 韓国 | GiGAeyes Live TV | [_gmTN6ssF7I](https://www.youtube.com/watch?v=_gmTN6ssF7I) |
| タオ島の浜辺 | タイ | Scuba Birds PADI 5 * IDC Dive Center, Koh Tao | [Ai9IV72sR2E](https://www.youtube.com/watch?v=Ai9IV72sR2E) |
| サムイ島ラマイ | タイ | Banyan Tree Samui | [wP6hpWgPJ98](https://www.youtube.com/watch?v=wP6hpWgPJ98) |
| ウェディオンボ海岸 | インドネシア | Kominfo Gunungkidul | [gwUwOto2gJg](https://www.youtube.com/watch?v=gwUwOto2gJg) |
| ダナン ロン橋（ドラゴンブリッジ）西側 | ベトナム | Phát Triển Đà Nẵng | [VHxNpNjKurU](https://www.youtube.com/watch?v=VHxNpNjKurU) |
| ニューカッスル港 | オーストラリア | Port of Newcastle | [tbQPUvUifEc](https://www.youtube.com/watch?v=tbQPUvUifEc) |
| ワイキキ水族館前の海 | アメリカ（ハワイ） | Waikiki Aquarium | [6tHEWDnxj2Y](https://www.youtube.com/watch?v=6tHEWDnxj2Y) |
| キラウエア火山 ハレマウマウ火口 | アメリカ（ハワイ） | USGS | [tk0tfYDxrUA](https://www.youtube.com/watch?v=tk0tfYDxrUA) |
| ワイキキビーチ | アメリカ（ハワイ） | EarthCam | [z_Dn0wGfGSU](https://www.youtube.com/watch?v=z_Dn0wGfGSU) |
| アビー・ロードの横断歩道 | イギリス | EarthCam | [zMCea32gpmg](https://www.youtube.com/watch?v=zMCea32gpmg) |
| ダブリン市街 | アイルランド | EarthCam | [3nyPER2kzqk](https://www.youtube.com/watch?v=3nyPER2kzqk) |
| セント・アイヴス港 | イギリス | Aspects Holidays | [T83mKGf_c3k](https://www.youtube.com/watch?v=T83mKGf_c3k) |
| ヴェネツィア 大運河 | イタリア | I Love You Venice | [r8N6IsoIkTk](https://www.youtube.com/watch?v=r8N6IsoIkTk) |
| ストロンボリ火山 | イタリア | Stromboli Volcano Live Webcam | [RYqExqxrpvs](https://www.youtube.com/watch?v=RYqExqxrpvs) |
| ロヴァニエミ アプッカ・リゾート | フィンランド | Apukka Resort Rovaniemi - Glass Igloo Hotel | [wT8Zhh9MBEE](https://www.youtube.com/watch?v=wT8Zhh9MBEE) |
| ヘルシンキ港 西港 | フィンランド | Port of Helsinki | [6hPWq2IG08M](https://www.youtube.com/watch?v=6hPWq2IG08M) |
| アムステルダム ダムラック（ベルラーへの取引所前） | オランダ | WebCam NL | [43qH0tDA6lM](https://www.youtube.com/watch?v=43qH0tDA6lM) |
| タマリウの浜辺（コスタ・ブラバ） | スペイン | EarthCam | [wiVzU1mcCTA](https://www.youtube.com/watch?v=wiVzU1mcCTA) |
| フンシャル市街（マデイラ島） | ポルトガル | Webcamtaxi | [_idE_q5kgtA](https://www.youtube.com/watch?v=_idE_q5kgtA) |
| ルツェルン市街 | スイス | Tele1 - Zentralschweizer Fernsehen | [QIt1FaDMnQc](https://www.youtube.com/watch?v=QIt1FaDMnQc) |
| レイキャネス半島の火山 | アイスランド | afarTV | [E_4y8jgvSRA](https://www.youtube.com/watch?v=E_4y8jgvSRA) |
| プラハ中心部 | チェコ | ITS akciová společnost | [3C8W4Rlgiog](https://www.youtube.com/watch?v=3C8W4Rlgiog) |
| コルフ島 アリラス | ギリシャ | Arillas Corfu LIVE streaming | [CcnlJI_UXyM](https://www.youtube.com/watch?v=CcnlJI_UXyM) |
| ガイランゲルフィヨルド | ノルウェー | Hotel Union Geiranger | [wAdTV6Uc5eA](https://www.youtube.com/watch?v=wAdTV6Uc5eA) |
| スカルスヴォーグ（ノールカップ近くの漁村） | ノルウェー | Skarsvåg bygdelag live cam | [iMqrD-HBDGo](https://www.youtube.com/watch?v=iMqrD-HBDGo) |
| タイムズスクエア | アメリカ | EarthCam | [AdUw5RdyZxI](https://www.youtube.com/watch?v=AdUw5RdyZxI) |
| ニューオーリンズ バーボン・ストリート | アメリカ | EarthCam | [ryyC8t-mxyQ](https://www.youtube.com/watch?v=ryyC8t-mxyQ) |
| ラスベガス フリーモント・ストリート | アメリカ | EarthCam | [2-WiWMLgfBs](https://www.youtube.com/watch?v=2-WiWMLgfBs) |
| コニーアイランド | アメリカ | EarthCam | [H67j7H-7QD0](https://www.youtube.com/watch?v=H67j7H-7QD0) |
| シーサイドハイツの海岸 | アメリカ | EarthCam | [OBgCrw-IyhE](https://www.youtube.com/watch?v=OBgCrw-IyhE) |
| ナイアガラの滝 | カナダ | Niagara Falls Live | [7gBzLGlJnwk](https://www.youtube.com/watch?v=7gBzLGlJnwk) |
| ピースブリッジ（米加国境の検問レーン） | カナダ | PeaceBridgeAuthority | [WPMgP2C3_co](https://www.youtube.com/watch?v=WPMgP2C3_co) |
| ポポカテペトル山 | メキシコ | afarTV | [8c4M11yu5L4](https://www.youtube.com/watch?v=8c4M11yu5L4) |
| フエゴ山 | グアテマラ | afarTV | [mRRrJJlO0vg](https://www.youtube.com/watch?v=mRRrJJlO0vg) |
| マホビーチ（飛行機が頭上を通る海岸） | シント・マールテン | Flightradar24 | [2IQmpCXbOmM](https://www.youtube.com/watch?v=2IQmpCXbOmM) |
| パロミノ島ビーチ | プエルトリコ | EarthCam | [MU8kI-PbVnM](https://www.youtube.com/watch?v=MU8kI-PbVnM) |
| リオデジャネイロ コパカバーナ海岸 | ブラジル | EarthCam | [6QoLEltTzIM](https://www.youtube.com/watch?v=6QoLEltTzIM) |
| ビジャリカ山 | チリ | Muni Pucón | [o0UgvQgceiE](https://www.youtube.com/watch?v=o0UgvQgceiE) |
| ビーニャ・デル・マールの海岸 | チリ | Marejadas UV | [EfMhfMtbN2Y](https://www.youtube.com/watch?v=EfMhfMtbN2Y) |
| ナミブ砂漠の水場 | ナミビア | NamibiaCam | [ydYDqZQpim8](https://www.youtube.com/watch?v=ydYDqZQpim8) |
| テンベ象公園の水場 | 南アフリカ | Explore Live Nature Cams | [0P_LBKqVbfs](https://www.youtube.com/watch?v=0P_LBKqVbfs) |
| ムパラの川（カバとワニ） | ケニア | Explore African Wildlife | [7x5kRo1B84Y](https://www.youtube.com/watch?v=7x5kRo1B84Y) |
| ムパラの水場 | ケニア | Explore African Wildlife | [oORXfTviuCs](https://www.youtube.com/watch?v=oORXfTviuCs) |
| ンコルホ・ブッシュロッジ | 南アフリカ | Explore Africa | [dIChLG4_WNs](https://www.youtube.com/watch?v=dIChLG4_WNs) |
| オリファンツ川 | 南アフリカ | Explore Africa | [_NXaovxB-Bk](https://www.youtube.com/watch?v=_NXaovxB-Bk) |
| ジュマ私営動物保護区 | 南アフリカ | Djuma Cam | [i1QL7zLACeA](https://www.youtube.com/watch?v=i1QL7zLACeA) |
| エルサレム 嘆きの壁 | イスラエル | EarthCam | [77akujLn4k8](https://www.youtube.com/watch?v=77akujLn4k8) |
| メッカ マスジド・ハラーム | サウジアラビア | قناة القران الكريم | [Cm1v4bteXbI](https://www.youtube.com/watch?v=Cm1v4bteXbI) |
| タイアロア岬 ロイヤルアルバトロスの巣 | ニュージーランド | Cornell Lab Bird Cams | [fDhIv9iBzWk](https://www.youtube.com/watch?v=fDhIv9iBzWk) |
| オアマルのブルーペンギン | ニュージーランド | Ōamaru Penguins | [IKhGWZeCns8](https://www.youtube.com/watch?v=IKhGWZeCns8) |
| タロンガ動物園のカピバラ | オーストラリア | Taronga Zoo Sydney | [6j7pqjym1EE](https://www.youtube.com/watch?v=6j7pqjym1EE) |
| ウェリビー動物園のライオン | オーストラリア | Zoos Victoria | [gTz_7tKUfYM](https://www.youtube.com/watch?v=gTz_7tKUfYM) |
| ポートリンカーンのミサゴの巣 | オーストラリア | Port Lincoln Osprey | [5SQd6QkBbc0](https://www.youtube.com/watch?v=5SQd6QkBbc0) |
| 成都パンダ繁育研究基地 | 中国 | iPanda | [gnEuhfyZPPQ](https://www.youtube.com/watch?v=gnEuhfyZPPQ) |
| 臥龍 耿達神樹坪パンダ基地 | 中国 | Explore Bears | [DP9hbJmwbNU](https://www.youtube.com/watch?v=DP9hbJmwbNU) |
| アビスコのオーロラ | スウェーデン | Lights Over Lapland - Abisko National Park, Sweden | [pCpB5z99nC8](https://www.youtube.com/watch?v=pCpB5z99nC8) |
| チャーチルのツンドラ（ホッキョクグマ） | カナダ | Explore Bears | [JwgMYoHvDoo](https://www.youtube.com/watch?v=JwgMYoHvDoo) |
| モントレーベイ水族館 ケルプの森 | アメリカ | Monterey Bay Aquarium | [w3LjpFhySTg](https://www.youtube.com/watch?v=w3LjpFhySTg) |
| モントレー湾（ラッコ・アザラシ） | アメリカ | Monterey Bay Aquarium | [fVa6-zCBR7A](https://www.youtube.com/watch?v=fVa6-zCBR7A) |
| ボネール島 サンゴ礁の水中 | オランダ領カリブ | Explore Live Nature Cams | [5o-ADtqyTJk](https://www.youtube.com/watch?v=5o-ADtqyTJk) |
| ジョージア水族館 ジンベエザメの水槽 | アメリカ | Ozolio Live | [8WTFWvePutc](https://www.youtube.com/watch?v=8WTFWvePutc) |
| コーネル鳥類学研究所の餌台 | アメリカ | Cornell Lab Bird Cams | [N609loYkFJo](https://www.youtube.com/watch?v=N609loYkFJo) |
| カトマイ ブルックス滝のヒグマ | アメリカ | Explore Bears | [EwTH5yY7Mks](https://www.youtube.com/watch?v=EwTH5yY7Mks) |
| チャーチルのオーロラ | カナダ | Explore Northern Lights & Nature Meditation Cams | [a0i1Kg6fROg](https://www.youtube.com/watch?v=a0i1Kg6fROg) |
| アビスコのオーロラ | スウェーデン | Lights Over Lapland - Abisko National Park, Sweden | [_zy6kB7W77I](https://www.youtube.com/watch?v=_zy6kB7W77I) |
| イルリサットの氷山 | グリーンランド（デンマーク） | afarTV | [0GRxQoFMmqo](https://www.youtube.com/watch?v=0GRxQoFMmqo) |
| ISSから見た地球（NASA公式） | 宇宙 | NASA | [P9C25Un7xaM](https://www.youtube.com/watch?v=P9C25Un7xaM) |

## 利用を停止しているサービス（通信しません）

- OpenSky Network：公開サービスでの運用利用には書面ライセンスが必要と規約に記載。許諾未確認のため停止
- Open-Meteo：無料APIは非商用限定。運営用途の確認ができていないため停止

## 天体の画像（NASA Image and Video Library）

情報パネルとツアーで表示する写真・想像図は、NASA Image and Video Library（https://images.nasa.gov/）の画像です。表示のたびに images-assets.nasa.gov から読み込みます（アプリには同梱していません）。

- NASAが制作した画像は、一般に米国では著作権の対象外です。NASAは、クレジットの表示と、NASAが推奨・保証しているように見せないことを求めています（NASA Images and Media Usage Guidelines：https://www.nasa.gov/nasa-brand-center/images-and-media/）。
- ESAなどとの共同画像は、各画像に付いているクレジットをそのまま表示しています。ESA/Hubbleの素材は CC BY 4.0 です。
- 各画像の下に、クレジットと元のページへのリンクを表示しています。

| 使用箇所 | NASA ID | 種類 | クレジット |
|---|---|---|---|
| 地球 | [as17-148-22727](https://images.nasa.gov/details/as17-148-22727) | 実写 | NASA |
| 月 | [GSFC_20171208_Archive_e000868](https://images.nasa.gov/details/GSFC_20171208_Archive_e000868) | 合成画像 | NASA Goddard Space Flight Center |
| ISS | [s132e012208](https://images.nasa.gov/details/s132e012208) | 実写 | NASA |
| ハッブル宇宙望遠鏡 | [s125e011921](https://images.nasa.gov/details/s125e011921) | 実写 | NASA |
| 太陽 | [GSFC_20171208_Archive_e002035](https://images.nasa.gov/details/GSFC_20171208_Archive_e002035) | 観測画像 | NASA/SDO |
| 水星 | [GSFC_20171208_Archive_e001922](https://images.nasa.gov/details/GSFC_20171208_Archive_e001922) | 実写 | NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington |
| 金星 | [PIA23791](https://images.nasa.gov/details/PIA23791) | 実写 | NASA/JPL-Caltech |
| 火星 | [PIA00003](https://images.nasa.gov/details/PIA00003) | 合成画像 | NASA/JPL/USGS |
| 木星 | [PIA04866](https://images.nasa.gov/details/PIA04866) | 合成画像 | NASA/JPL/Space Science Institute |
| 土星 | [PIA06193](https://images.nasa.gov/details/PIA06193) | 合成画像 | NASA/JPL/Space Science Institute |
| 天王星 | [PIA18182](https://images.nasa.gov/details/PIA18182) | 実写 | NASA/JPL-Caltech |
| 海王星 | [PIA01492](https://images.nasa.gov/details/PIA01492) | 実写 | NASA/JPL |
| ボイジャー1号・ボイジャー2号 | [PIA17049](https://images.nasa.gov/details/PIA17049) | 想像図 | NASA/JPL-Caltech |
| ヘリオポーズ | [PIA13892](https://images.nasa.gov/details/PIA13892) | 想像図 | NASA/JPL-Caltech |
| ケンタウルス座α星 | [GSFC_20171208_Archive_e000214](https://images.nasa.gov/details/GSFC_20171208_Archive_e000214) | 実写 | ESA/NASA |
| エリダヌス座ε星 | [PIA11375](https://images.nasa.gov/details/PIA11375) | 想像図 | NASA/JPL-Caltech |
| TRAPPIST-1 | [PIA22093](https://images.nasa.gov/details/PIA22093) | 想像図 | NASA/JPL-Caltech |
| いて座A*（銀河中心付近） | [PIA13932](https://images.nasa.gov/details/PIA13932) | 観測画像 | NASA/JPL-Caltech |
| 天の川銀河（渦状腕・太陽系の位置も同じ画像） | [PIA10748](https://images.nasa.gov/details/PIA10748) | 想像図 | NASA/JPL-Caltech |
| アンドロメダ銀河 | [PIA15416](https://images.nasa.gov/details/PIA15416) | 観測画像 | NASA/JPL-Caltech |
| さんかく座銀河 | [PIA11969](https://images.nasa.gov/details/PIA11969) | 観測画像 | NASA/JPL-Caltech/Univ. of Ariz. |
| 大マゼラン雲 | [PIA07137](https://images.nasa.gov/details/PIA07137) | 観測画像 | NASA/JPL-Caltech/STScI |
| 小マゼラン雲 | [PIA12485](https://images.nasa.gov/details/PIA12485) | 観測画像 | NASA/JPL-Caltech/STScI |
| おとめ座銀河団 | [PIA07906](https://images.nasa.gov/details/PIA07906) | 観測画像 | NASA/JPL-Caltech/SSC |
| ペルセウス銀河団 | [GSFC_20171208_Archive_e000078](https://images.nasa.gov/details/GSFC_20171208_Archive_e000078) | 合成画像 | NASA's Goddard Space Flight Center/Stephen Walker |
| かみのけ座銀河団 | [GSFC_20171208_Archive_e002070](https://images.nasa.gov/details/GSFC_20171208_Archive_e002070) | 実写 | NASA, ESA, and the Hubble Heritage Team (STScI/AURA) |
| 観測可能な宇宙 | [GSFC_20171208_Archive_e001651](https://images.nasa.gov/details/GSFC_20171208_Archive_e001651) | 実写 | NASA; ESA; G. Illingworth, D. Magee, and P. Oesch (UC Santa Cruz); R. Bouwens (Leiden University); and the HUDF09 Team |
| 宇宙マイクロ波背景放射 | [PIA16874](https://images.nasa.gov/details/PIA16874) | 解説図 | NASA/JPL-Caltech/ESA |
| すばる（M45） | [PIA09262](https://images.nasa.gov/details/PIA09262) | 観測画像 | NASA/JPL-Caltech |
| オリオン大星雲（M42） | [PIA01322](https://images.nasa.gov/details/PIA01322) | 合成画像 | NASA/JPL-Caltech/STScI |
| わし星雲（M16） | [PIA25433](https://images.nasa.gov/details/PIA25433) | 観測画像 | NASA/JPL-Caltech |
| らせん状星雲（NGC 7293） | [PIA15658](https://images.nasa.gov/details/PIA15658) | 観測画像 | NASA/JPL-Caltech |
| 子持ち銀河（M51） | [PIA10200](https://images.nasa.gov/details/PIA10200) | 合成画像 | X-ray: NASA/CXC; UV: NASA/JPL-Caltech; Optical: NASA/ESA/STScI/AURA; IR: NASA/JPL-Caltech/Univ. of Ariz. |
| ソンブレロ銀河（M104） | [PIA15226](https://images.nasa.gov/details/PIA15226) | 実写 | NASA/STScI/AURA |
| 冥王星 | [PIA19952](https://images.nasa.gov/details/PIA19952) | 観測画像 | NASA/Johns Hopkins University Applied Physics Laboratory/Southwest Research Institute |
| ハレー彗星 | [PIA17485](https://images.nasa.gov/details/PIA17485) | 実写 | NASA/ESA/Giotto Project |
| ベスタ | [PIA14778](https://images.nasa.gov/details/PIA14778) | 実写 | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA |
| トリトン | [PIA00317](https://images.nasa.gov/details/PIA00317) | 合成画像 | NASA/JPL/USGS |

## 自作の表現

- 星・星座・星雲・小天体・衛星の「イメージ図」（情報パネルの画像）は、第三者の画像を使わずにプログラムで描いたものです。星座の図は、上記の星座線データから描いています。
- 木星・土星の縞模様、土星の環の濃淡、銀河の腕・宇宙の網目構造・CMBの模様は、第三者の画像を使わずにプログラムで描いた模式表現です。
- 権利を確認できる写真を用意できなかった天体（近くの恒星の多く、天宮、矮小銀河の一部、ノルマ銀河団、シャプレー超銀河団、ラニアケア超銀河団、MoM-z14、小惑星帯など）は、このアプリがプログラムで描いた「イメージ図」を表示しています。第三者の素材は使っていません。
