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

## 自作の表現

- 木星・土星の縞模様、土星の環の濃淡、銀河の腕・宇宙の網目構造・CMBの模様は、第三者の画像を使わずにプログラムで描いた模式表現です。
- 権利を確認できる写真を用意できなかった天体（近くの恒星の多く、天宮、矮小銀河の一部、ノルマ銀河団、シャプレー超銀河団、ラニアケア超銀河団、MoM-z14、小惑星帯など）は、このアプリがプログラムで描いた「イメージ図」を表示しています。第三者の素材は使っていません。
