import { describe, expect, it } from "vitest";
import { TeamManager } from "../game/team-manager";
import { Worm } from "../entities/worm";

function createTeamManager() {
  const manager = new TeamManager(800, 600);
  const redWorms = [
    new Worm(100, 100, "Red", "R1"),
    new Worm(120, 100, "Red", "R2"),
    new Worm(140, 100, "Red", "R3"),
  ];
  const blueWorms = [
    new Worm(200, 100, "Blue", "B1"),
    new Worm(220, 100, "Blue", "B2"),
    new Worm(240, 100, "Blue", "B3"),
  ];
  manager.teams = [
    { id: "Red", worms: redWorms },
    { id: "Blue", worms: blueWorms },
  ];
  manager.resetActiveWormIndex();
  return manager;
}

describe("TeamManager worm rotation", () => {
  it("cycles through each team's worms independently", () => {
    const manager = createTeamManager();

    expect(manager.activeTeam.id).toBe("Red");
    expect(manager.activeWorm.name).toBe("R1");

    manager.advanceToNextTeam();
    expect(manager.activeTeam.id).toBe("Blue");
    expect(manager.activeWorm.name).toBe("B1");

    manager.advanceToNextTeam();
    expect(manager.activeTeam.id).toBe("Red");
    expect(manager.activeWorm.name).toBe("R2");

    manager.advanceToNextTeam();
    expect(manager.activeTeam.id).toBe("Blue");
    expect(manager.activeWorm.name).toBe("B2");
  });

  it("skips defeated worms when advancing rotation", () => {
    const manager = createTeamManager();

    const firstRed = manager.activeWorm;
    firstRed.alive = false;
    firstRed.health = 0;

    manager.advanceToNextTeam();
    expect(manager.activeTeam.id).toBe("Blue");
    expect(manager.activeWorm.name).toBe("B1");

    manager.advanceToNextTeam();
    expect(manager.activeTeam.id).toBe("Red");
    expect(manager.activeWorm.name).toBe("R2");
  });

  it("skips teams without any living worms", () => {
    const manager = createTeamManager();

    manager.teams[1]!.worms.forEach((worm) => {
      worm.alive = false;
      worm.health = 0;
    });

    manager.advanceToNextTeam();
    expect(manager.activeTeam.id).toBe("Red");
    expect(manager.activeWorm.name).toBe("R2");

    manager.setCurrentTeamIndex(1);
    manager.resetActiveWormIndex();
    expect(manager.activeTeam.id).toBe("Red");
    expect(manager.activeWorm.name).toBe("R1");
  });
});
