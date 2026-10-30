<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let w = 0;
let h = 0;
let raf = 0;
let accent = '#409eff';

function resize(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

function init(): void {
  const count = Math.min(80, Math.floor((w * h) / 20000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    r: Math.random() * 1.8 + 0.6,
  }));
}

function draw(): void {
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  const link = 130;

  // 粒子
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.45;
    ctx.fill();
  }

  // 近距离连线
  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < link) {
        ctx.globalAlpha = (1 - d / link) * 0.22;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  raf = requestAnimationFrame(draw);
}

function onResize(): void {
  resize();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  // 读取主题强调色作为粒子颜色
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
  if (raw) accent = raw;
  resize();
  init();
  draw();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <canvas ref="canvasRef" class="particles-canvas" aria-hidden="true" />
</template>

<style scoped>
.particles-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.4;
}
</style>