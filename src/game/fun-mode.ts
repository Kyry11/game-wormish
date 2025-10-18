import { WORLD, randRange } from "../definitions";
import { Particle } from "../entities";
import type { Worm, WormUpdateModifiers } from "../entities/worm";

const FUN_CONFETTI_COLORS = [
  "#ff71ce",
  "#b967ff",
  "#01cdfe",
  "#05ffa1",
  "#fffb96",
  "#ffa44d",
];

const FUN_EMOJIS = ["🎉", "🥳", "🎈", "✨"];

export type FunModeBackgroundPalette = {
  skyTop: string;
  skyBottom: string;
  water: string;
};

export class FunModeController {
  private active = false;
  private toggledAt = 0;
  private lastAmbientAt: number | null = null;
  private readonly movementModifiers: WormUpdateModifiers = {
    walkSpeedMultiplier: 1.4,
    jumpSpeedMultiplier: 1.2,
    gravityScale: 0.85,
  };

  toggle(now: number): boolean {
    this.active = !this.active;
    this.toggledAt = now;
    this.lastAmbientAt = this.active ? null : now;
    return this.active;
  }

  isActive() {
    return this.active;
  }

  getMovementModifiers(): WormUpdateModifiers | undefined {
    if (!this.active) return undefined;
    return this.movementModifiers;
  }

  getBackgroundPalette(now: number): FunModeBackgroundPalette | undefined {
    if (!this.active) return undefined;
    const elapsed = Math.max(0, now - this.toggledAt);
    const hueBase = (elapsed / 1000) * 48;
    const skyTopHue = Math.round(hueBase % 360);
    const skyBottomHue = Math.round((hueBase + 60) % 360);
    const waterHue = Math.round((hueBase + 180) % 360);
    return {
      skyTop: `hsl(${skyTopHue}, 82%, 70%)`,
      skyBottom: `hsl(${skyBottomHue}, 88%, 82%)`,
      water: `hsl(${waterHue}, 70%, 58%)`,
    };
  }

  getHudLabel(now: number) {
    if (!this.active) return "Press F for Fun Mode";
    const elapsed = Math.max(0, now - this.toggledAt);
    const seconds = Math.floor(elapsed / 1000);
    const emoji = FUN_EMOJIS[seconds % FUN_EMOJIS.length] ?? FUN_EMOJIS[0]!;
    return `Fun Mode ${emoji}`;
  }

  shouldEmitAmbient(now: number, intervalMs: number) {
    if (!this.active) {
      this.lastAmbientAt = now;
      return false;
    }
    if (this.lastAmbientAt == null) {
      this.lastAmbientAt = now;
      return true;
    }
    if (now - this.lastAmbientAt >= intervalMs) {
      this.lastAmbientAt = now;
      return true;
    }
    return false;
  }

  resetAmbient(now: number) {
    this.lastAmbientAt = now;
  }
}

export function createConfettiBurst(
  x: number,
  y: number,
  count = 24,
  options: { speedMin?: number; speedMax?: number; gravityScale?: number } = {}
) {
  const { speedMin = 80, speedMax = 260, gravityScale = 0.05 } = options;
  const gravity = WORLD.gravity * gravityScale;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(speedMin, speedMax);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - randRange(40, 140);
    const life = randRange(0.9, 1.8);
    const size = randRange(1.4, 3.4);
    const color = FUN_CONFETTI_COLORS[i % FUN_CONFETTI_COLORS.length]!;
    particles.push(new Particle(x, y, vx, vy, life, size, color, gravity));
  }
  return particles;
}

export function createConfettiTrail(worm: Worm) {
  const particles: Particle[] = [];
  const baseY = worm.y - worm.radius - 6;
  for (let i = 0; i < 6; i++) {
    const angle = randRange(Math.PI, Math.PI * 2);
    const speed = randRange(30, 120);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - randRange(30, 70);
    const life = randRange(0.6, 1.1);
    const size = randRange(1.1, 2.5);
    const color = FUN_CONFETTI_COLORS[Math.floor(randRange(0, FUN_CONFETTI_COLORS.length))]!;
    particles.push(
      new Particle(
        worm.x,
        baseY,
        vx,
        vy,
        life,
        size,
        color,
        WORLD.gravity * 0.03
      )
    );
  }
  return particles;
}
