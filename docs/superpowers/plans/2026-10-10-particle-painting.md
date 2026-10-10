# 颜料粒子画境 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Existing cloud checkout is isolated; native execution follows the user's explicit refinement request.

**Goal:** 将现有绘画空间转为有厚度、聚散和流动的颜料粒子场，消除可见硬边。

**Architecture:** `particle-paint.ts` 负责表面/体积采样、颜料颜色和粒子着色；`world.ts` 保留不可见空间骨架并接入粒子。`particle-grade.ts` 提供轻量柔光与纸纹，`experience.ts` 使用新画面处理。现有控制与镜头路径继续使用。

**Tech Stack:** TypeScript、Three.js、Vite、Playwright、FFmpeg。

**Spec:** `docs/superpowers/specs/2026-10-10-particle-painting-design.md`

## Global Constraints

- 不新增依赖；保持冷灰、粉白、赭红、炭黑的颜料色系。
- 不显示建筑的实体三角面；粒子必须具有厚度与稀疏边缘。
- 48 秒运动闭合；减少动态效果时初始暂停。
- 使用当前云 checkout，保存第二版源码与已发布的视频。

## Review Focus

- 颜料纹理加载失败：备用粒子仍可显示。
- 资源加载中销毁：不再向已销毁场景添加粒子。
- 远景与不同画幅：颜色有效，点数受控，画面可辨识。
- 48 秒接缝：粒子流动与相机连续。
- 暂停与拖动：更新到指定时刻并保持静止，无画面闪烁。

## Tasks

- [x] 以实际盒体和颜料样本测试粒子采样：固定种子一致、有限位置、有效颜色、非平面厚度；运行失败检查。
- [x] 实现 `samplePaintCloud(meshes, count, seed)` 与 `createParticlePainting(meshes)`；主体、水面与倒影均为点群，按阶段更新与清理。
- [x] 接入 `world.ts`，隐藏采样骨架；替换实体镜面和重型面材质渲染，保留加载失败和销毁保护。加入 360 度的灰蓝晕染、粉白雾层和炭黑墨团，覆盖远景空隙并保持原画颜色。
- [x] 加入轻量柔光/纸纹画面处理与界面介绍；运行生成测试、现有控制检查和实际粒子渲染检查。
- [x] 检查正面、内部、抬升、环绕八个时刻，方形与竖屏；独立代码审查。
- [x] 导出 MP4，完整解码并抽帧，准备最新源码包与 GitHub 发布文件。发布与实际下载检查继续按当前会话计划完成。
