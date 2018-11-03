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
  type: string;
  cooldown: number;
  damage: number;
  defence: number;
  charge: number;
};

export const $actionData: ActionData[] = [
  {
    type: "attack",
    cooldown: 5,
    damage: 5,
    defence: 0,
    charge: -2
  },
  {
    type: "quick-attack",
    cooldown: 2,
    damage: 2,
    defence: 0,
    charge: -1
  },
  {
    type: "deffence",
    cooldown: 3,
    damage: 0,
    defence: 4,
    charge: +1
  },
  {
    type: "do-nothing",
    cooldown: 4,
    damage: 0,
    defence: 0,
    charge: +2
  }
];

export function createEnv(): Env {
  return {
    player: createBattler(PLAYER_ID),
    enemy: createBattler(ENEMY_ID)
  };
}

function createBattler(id: number): Battler {
  return {
    id,
    life: 100,
    cooldown: 0,
    charge: 0,
    defence: 0
  };
}

export function processTurn(
  env: Env,
  onSelectAction: (battlerId: number) => number
): Env {
  const newEnv = clone(env);
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
      const other = battlers.find(b => b.id !== self.id);
      const aid = onSelectAction(self.id);
      const actionData = $actionData[aid];
      if (other) {
        console.log(
          `${self.id}: ${self.life}/${self.charge} > ${actionData.type}`
        );

        const canExec = actionData.charge + self.charge >= 0;
        if (canExec) {
          const penetratedDamage = Math.max(
            0,
            actionData.damage - other.defence
          );

          if (penetratedDamage > 0) {
            const beforeLife = other.life;
            other.life -= penetratedDamage;
            console.log(`> ${other.id}'s life: ${beforeLife} -> ${other.life}`);
          } else if (actionData.damage > 0) {
            console.log("> no damage!");
          }
          self.cooldown = actionData.cooldown;
          self.defence = actionData.defence;
          self.charge += actionData.charge;
        } else {
          console.log(`Failed: ${self.id}'s ${actionData.type}`);
          // fallback to do-nothing
          self.cooldown = actionData.cooldown;
          self.charge += 1;
        }
      }
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
