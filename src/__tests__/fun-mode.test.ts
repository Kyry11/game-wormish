import { describe, expect, it } from "vitest";
import { FunModeController } from "../game/fun-mode";

const MS = 1000;

describe("FunModeController", () => {
  it("toggles active state and exposes modifiers", () => {
    const fun = new FunModeController();
    expect(fun.isActive()).toBe(false);

    const enabled = fun.toggle(2 * MS);
    expect(enabled).toBe(true);
    expect(fun.isActive()).toBe(true);
    expect(fun.getMovementModifiers()).toBeDefined();

    const disabled = fun.toggle(3 * MS);
    expect(disabled).toBe(false);
    expect(fun.isActive()).toBe(false);
    expect(fun.getMovementModifiers()).toBeUndefined();
  });

  it("generates a cycling HUD label when active", () => {
    const fun = new FunModeController();
    fun.toggle(0);
    expect(fun.getHudLabel(500)).toMatch(/Fun Mode/);
    const later = fun.getHudLabel(5 * MS);
    expect(later).toMatch(/Fun Mode/);
  });

  it("emits ambient triggers on interval while active", () => {
    const fun = new FunModeController();
    fun.toggle(0);
    // First call after activation emits immediately
    expect(fun.shouldEmitAmbient(10, 200)).toBe(true);
    // Subsequent call before interval should not emit
    expect(fun.shouldEmitAmbient(100, 200)).toBe(false);
    // After interval has passed, it should emit again
    expect(fun.shouldEmitAmbient(250, 200)).toBe(true);

    // Deactivate clears emission
    fun.toggle(500);
    expect(fun.shouldEmitAmbient(800, 200)).toBe(false);
  });
});
