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

## 自作の表現

- 木星・土星の縞模様、土星の環の濃淡、銀河の腕・宇宙の網目構造・CMBの模様は、第三者の画像を使わずにプログラムで描いた模式表現です。
