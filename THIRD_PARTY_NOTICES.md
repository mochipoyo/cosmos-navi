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
