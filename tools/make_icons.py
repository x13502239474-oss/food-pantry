#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 PWA 图标（纯标准库，无第三方依赖）。

图形：绿色底 + 白色饭碗 + 三缕蒸汽。全幅底色，符合 maskable 安全区要求。
用法：python tools/make_icons.py
"""
import math
import os
import struct
import zlib

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'icons'))
BRAND = (31, 122, 92, 255)   # #1F7A5C
WHITE = (255, 255, 255, 255)
SS = 2                        # 超采样倍数，用于抗锯齿


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = bytearray(bytes(BRAND) * (w * h))

    def rect(self, x0, y0, x1, y1, color):
        x0, y0 = max(0, int(round(x0))), max(0, int(round(y0)))
        x1, y1 = min(self.w, int(round(x1))), min(self.h, int(round(y1)))
        if x1 <= x0 or y1 <= y0:
            return
        row = bytes(color) * (x1 - x0)
        for y in range(y0, y1):
            off = y * self.w * 4 + x0 * 4
            self.px[off:off + len(row)] = row

    def circle(self, cx, cy, r, color):
        for dy in range(-int(r), int(r) + 1):
            y = cy + dy
            dx = math.sqrt(max(0.0, r * r - dy * dy))
            self.rect(cx - dx, y, cx + dx, y + 1, color)

    def bowl(self, cx, cy, r, color):
        """下半圆（碗体）"""
        for dy in range(0, int(r) + 1):
            y = cy + dy
            dx = math.sqrt(max(0.0, r * r - dy * dy))
            self.rect(cx - dx, y, cx + dx, y + 1, color)

    def round_rect(self, x, y, w, h, r, color):
        r = min(r, w / 2, h / 2)
        self.rect(x + r, y, x + w - r, y + h, color)
        self.rect(x, y + r, x + w, y + h - r, color)
        for cx, cy in ((x + r, y + r), (x + w - r, y + r),
                       (x + r, y + h - r), (x + w - r, y + h - r)):
            self.circle(cx, cy, r, color)

    def downsample(self, factor):
        out_w, out_h = self.w // factor, self.h // factor
        out = bytearray(out_w * out_h * 4)
        for y in range(out_h):
            for x in range(out_w):
                rs = gs = bs = ass = 0
                for dy in range(factor):
                    base = ((y * factor + dy) * self.w + x * factor) * 4
                    for dx in range(factor):
                        i = base + dx * 4
                        rs += self.px[i]; gs += self.px[i + 1]
                        bs += self.px[i + 2]; ass += self.px[i + 3]
                n = factor * factor
                o = (y * out_w + x) * 4
                out[o:o + 4] = bytes((rs // n, gs // n, bs // n, ass // n))
        return out_w, out_h, out


def write_png(path, w, h, pixels):
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)  # filter type 0
        raw.extend(pixels[y * stride:(y + 1) * stride])

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)  # RGBA, 8bit
    blob = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
            chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(blob)


def make(size, filename):
    s = size * SS
    c = Canvas(s, s)
    cx = s * 0.5
    # 碗：下半圆 + 碗沿
    c.bowl(cx, s * 0.505, s * 0.275, WHITE)
    c.round_rect(s * 0.205, s * 0.485, s * 0.59, s * 0.045, s * 0.022, WHITE)
    # 蒸汽：三缕错位圆角短竖条
    c.round_rect(s * 0.335, s * 0.165, s * 0.055, s * 0.155, s * 0.027, WHITE)
    c.round_rect(s * 0.472, s * 0.115, s * 0.055, s * 0.205, s * 0.027, WHITE)
    c.round_rect(s * 0.610, s * 0.165, s * 0.055, s * 0.155, s * 0.027, WHITE)
    w, h, px = c.downsample(SS)
    path = os.path.join(OUT, filename)
    write_png(path, w, h, px)
    print('wrote', path, w, 'x', h)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    make(192, 'icon-192.png')
    make(512, 'icon-512.png')
    make(180, 'icon-180.png')
