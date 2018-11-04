import { clone } from "lodash";

export const PLAYER_ID = 1;
export const ENEMY_ID = 2;

export type Env = {
  player: Battler;
  enemy: Battler;
};

export type Battler = {
  id: number;
  life: number;
  cooldown: number;
  charge: number;
  defence: number;
};

export type ActionData = {
  id: number;
  type: string;
  cooldown: number;
  damage: number;
  defence: number;
  charge: number;
};

export const $actionData: ActionData[] = [
  {
    id: 0,
    type: "attack",
    cooldown: 5,
    damage: 5,
    defence: 0,
    charge: -2
  },
  {
    id: 1,
    type: "quick-attack",
    cooldown: 2,
    damage: 2,
    defence: 0,
    charge: -1
  },
  {
    id: 2,
    type: "defence",
    cooldown: 3,
    damage: 0,
    defence: 4,
    charge: +1
  },
  {
    id: 3,
    type: "do-nothing",
    cooldown: 4,
    damage: 0,
    defence: 0,
    charge: +2
  }
];

const DEBUG = true;
const log = (...args: any): void => {
  DEBUG && console.log(...args);
};

export function createEnv(): Env {
  return {
    player: createBattler(PLAYER_ID),
    enemy: createBattler(ENEMY_ID)
  };
}

function createBattler(id: number): Battler {
  return {
    id,
    life: 30,
    cooldown: 0,
    charge: 0,
    defence: 0
  };
}

export function applyActionToEnv(
  env: Env,
  actorId: number,
  actionId: number,
  DEBUG: boolean = false
): Env {
  let newEnv = clone(env);
  const battlers = [newEnv.player, newEnv.enemy];

  const self = battlers.find(b => b.id === actorId);
  const other = battlers.find(b => b.id !== actorId);
  const action = $actionData[actionId];

  if (self && other) {
    DEBUG && log(`${actorId}: ${self.life}/${self.charge} > ${action.type}`);

    const canExec = action.charge + self.charge >= 0;
    if (canExec) {
      const penetratedDamage = Math.max(0, action.damage - other.defence);

      if (penetratedDamage > 0) {
        const beforeLife = other.life;
        other.life -= penetratedDamage;
        DEBUG && log(`> ${other.id}'s life: ${beforeLife} -> ${other.life}`);
      } else if (action.damage > 0) {
        DEBUG && log("> no damage!");
      }
      self.cooldown = action.cooldown;
      self.defence = action.defence;
      self.charge += action.charge;
    } else {
      DEBUG && log(`Failed: ${self.id}'s ${action.type}`);
      // fallback to do-nothing
      self.cooldown = action.cooldown;
      self.charge += 1;
    }
  }

  return newEnv;
}

export function processTurn(
  env: Env,
  opts: {
    onSelectAction: (battlerId: number) => number;
  },
  DEBUG: boolean = false
): Env {
  let newEnv = clone(env);
  const battlers = [newEnv.player, newEnv.enemy];

  battlers.forEach(self => {
    if (self.life <= 0) {
      return;
    }

    if (self.cooldown > 0) {
      self.cooldown--;
    } else {
      // reset defence
      self.defence = 0;
      const aid = opts.onSelectAction(self.id);
      newEnv = applyActionToEnv(newEnv, self.id, aid, DEBUG);
    }
  });

  return newEnv;
}

export function judgeWinner(env: Env): number | null {
  const battlers = [env.player, env.enemy];
  if (battlers.some(b => b.life <= 0)) {
    const winner = battlers.find(b => b.life > 0);
    if (winner) {
      return winner.id;
    }
  }
  return null;
}
