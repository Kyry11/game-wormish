import type { TeamId } from "../definitions";
import { GAMEPLAY, WORLD, randRange } from "../definitions";
import { Terrain, Worm } from "../entities";

export type Team = {
  id: TeamId;
  worms: Worm[];
};

export class TeamManager {
  teams: Team[] = [];

  private currentTeamIndex = 0;
  private currentWormIndex = 0;
  private readonly wormRotation = new Map<TeamId, number>();

  constructor(private readonly width: number, private readonly height: number) {}

  initialize(terrain: Terrain) {
    this.teams = [
      { id: "Red", worms: [] },
      { id: "Blue", worms: [] },
    ];
    this.currentTeamIndex = 0;
    this.currentWormIndex = 0;
    this.wormRotation.clear();
    this.spawnTeams(terrain);
    for (const team of this.teams) {
      this.setRotationForTeam(team, 0);
    }
    this.ensureActiveWorm();
  }

  setCurrentTeamIndex(index: number) {
    if (this.teams.length === 0) return;
    const normalized = ((index % this.teams.length) + this.teams.length) % this.teams.length;
    const nextAlive = this.findNextAliveTeamIndex(normalized);
    this.currentTeamIndex = nextAlive ?? normalized;
    this.currentWormIndex = this.getRotationForTeam(this.activeTeam);
    this.ensureActiveWorm();
  }

  resetActiveWormIndex() {
    if (this.teams.length === 0) return;
    for (const team of this.teams) {
      this.setRotationForTeam(team, 0);
    }
    const firstAlive = this.findNextAliveTeamIndex(0);
    if (firstAlive != null) {
      this.currentTeamIndex = firstAlive;
    }
    this.currentWormIndex = this.getRotationForTeam(this.activeTeam);
    this.ensureActiveWorm();
  }

  advanceToNextTeam() {
    if (this.teams.length === 0) return;
    const previousTeamIndex = this.currentTeamIndex;
    const currentTeam = this.teams[previousTeamIndex]!;
    this.advanceRotationForTeam(currentTeam);

    const nextTeamIndex = this.findNextAliveTeamIndex(previousTeamIndex + 1);
    if (nextTeamIndex != null) {
      this.currentTeamIndex = nextTeamIndex;
      this.currentWormIndex = this.getRotationForTeam(this.activeTeam);
      this.ensureActiveWorm();
      return;
    }

    // No other living teams remain; keep focus on the current team.
    this.currentTeamIndex = previousTeamIndex;
    this.currentWormIndex = this.getRotationForTeam(currentTeam);
    this.ensureActiveWorm();
  }

  get activeTeam(): Team {
    return this.teams[this.currentTeamIndex]!;
  }

  get activeTeamIndex(): number {
    return this.currentTeamIndex;
  }

  get activeWormIndex(): number {
    return this.currentWormIndex;
  }

  get activeWorm(): Worm {
    return this.ensureActiveWorm();
  }

  getTeamHealth(id: TeamId) {
    const team = this.teams.find((t) => t.id === id);
    if (!team) return 0;
    return team.worms.reduce((sum, w) => sum + (w.alive ? w.health : 0), 0);
  }

  isTeamAlive(id: TeamId) {
    const team = this.teams.find((t) => t.id === id);
    if (!team) return false;
    return team.worms.some((w) => w.alive);
  }

  forEachWorm(callback: (worm: Worm, team: Team) => void) {
    for (const team of this.teams) {
      for (const worm of team.worms) {
        callback(worm, team);
      }
    }
  }

  forEachAliveWorm(callback: (worm: Worm, team: Team) => void) {
    this.forEachWorm((worm, team) => {
      if (worm.alive) {
        callback(worm, team);
      }
    });
  }

  killWormsBelow(yThreshold: number) {
    this.forEachAliveWorm((worm) => {
      if (worm.y > yThreshold) {
        worm.alive = false;
      }
    });
  }

  private ensureActiveWorm(): Worm {
    const team = this.teams[this.currentTeamIndex]!;
    if (team.worms.length === 0) {
      throw new Error("Team has no worms");
    }
    let idx = this.getRotationForTeam(team) % team.worms.length;
    for (let i = 0; i < team.worms.length; i++) {
      const worm = team.worms[(idx + i) % team.worms.length]!;
      if (worm.alive) {
        const resolvedIndex = (idx + i) % team.worms.length;
        this.currentWormIndex = resolvedIndex;
        this.setRotationForTeam(team, resolvedIndex);
        return worm;
      }
    }
    // If none alive, return first worm for stability
    this.currentWormIndex = 0;
    this.setRotationForTeam(team, 0);
    return team.worms[0]!;
  }

  private getRotationForTeam(team: Team): number {
    const stored = this.wormRotation.get(team.id);
    if (stored == null) {
      this.wormRotation.set(team.id, 0);
      return 0;
    }
    return stored;
  }

  private setRotationForTeam(team: Team, index: number) {
    if (team.worms.length === 0) {
      this.wormRotation.set(team.id, 0);
      return;
    }
    const normalized = ((index % team.worms.length) + team.worms.length) % team.worms.length;
    this.wormRotation.set(team.id, normalized);
  }

  private advanceRotationForTeam(team: Team) {
    if (team.worms.length === 0) {
      this.setRotationForTeam(team, 0);
      return;
    }
    const start = this.getRotationForTeam(team);
    for (let offset = 1; offset <= team.worms.length; offset++) {
      const idx = (start + offset) % team.worms.length;
      const worm = team.worms[idx]!;
      if (worm.alive) {
        this.setRotationForTeam(team, idx);
        return;
      }
    }
    // No alive worms found, keep current rotation to avoid churn
    this.setRotationForTeam(team, start);
  }

  private findNextAliveTeamIndex(startIndex: number): number | null {
    if (this.teams.length === 0) return null;
    for (let offset = 0; offset < this.teams.length; offset++) {
      const idx = (startIndex + offset) % this.teams.length;
      const team = this.teams[idx]!;
      if (team.worms.some((worm) => worm.alive)) {
        return idx;
      }
    }
    return null;
  }

  private spawnTeams(terrain: Terrain) {
    const positions: number[] = [];
    const lanes = GAMEPLAY.teamSize * 2 + 2;
    for (let i = 1; i <= lanes; i++) {
      positions.push(Math.floor((i / (lanes + 1)) * this.width));
    }

    let posIndex = 0;
    for (let teamIndex = 0; teamIndex < this.teams.length; teamIndex++) {
      const team = this.teams[teamIndex]!;
      for (let i = 0; i < GAMEPLAY.teamSize; i++) {
        const x = positions[posIndex++ % positions.length]! + randRange(-30, 30);
        const y = this.findGroundY(terrain, Math.floor(x));
        const worm = new Worm(x, y, team.id, `${team.id[0]}${i + 1}`);
        this.settleSpawn(terrain, worm);
        team.worms.push(worm);
      }
    }
  }

  private findGroundY(terrain: Terrain, x: number) {
    for (let y = 0; y < this.height; y++) {
      if (terrain.isSolid(x, y)) {
        return y - WORLD.wormRadius - 2;
      }
    }
    return this.height * 0.5;
  }

  private settleSpawn(terrain: Terrain, worm: Worm) {
    const maxDrop = 240;
    const step = 2;
    let sy = worm.y - 6;
    let hit = false;
    for (let d = 0; d <= maxDrop; d += step) {
      const ty = sy + d;
      if (terrain.circleCollides(worm.x, ty, worm.radius)) {
        sy = ty;
        hit = true;
        break;
      }
    }
    if (hit) {
      const res = terrain.resolveCircle(
        worm.x,
        sy,
        worm.radius,
        Math.max(32, worm.radius + 32)
      );
      worm.x = res.x;
      worm.y = res.y;
      worm.vy = 0;
      worm.onGround = true;
    } else {
      const res = terrain.resolveCircle(worm.x, worm.y + 3, worm.radius, 12);
      worm.x = res.x;
      worm.y = res.y;
      worm.vy = 0;
      worm.onGround = res.onGround;
    }
  }
}
