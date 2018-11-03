import "@babel/polyfill";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-node-gpu";
import { sampleSize, sample, range } from "lodash";
import { Sequential } from "@tensorflow/tfjs";

const PLAYER_ID = 1;
const ENEMY_ID = 2;
const REWARD_GAMMA = 0.9;
const EPSILON_MIN = 0.01;
const EPSILON_DECAY = 0.9999;

type Battler = {
  id: number;
  life: number;
  cooldown: number;
  charge: number;
  defence: number;
};

type ActionData = {
  type: string;
  cooldown: number;
  damage: number;
  defence: number;
  charge: number;
};

function serializeAction(data: ActionData): number[] {
  return [data.damage, data.defence, data.cooldown, data.charge];
}

const $actionData: ActionData[] = [
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

function createBattler(id: number): Battler {
  return {
    id,
    life: 100,
    cooldown: 0,
    charge: 0,
    defence: 0
  };
}

function selectRandomAction() {
  return Math.floor(Math.random() * 4);
}

function selectAction(gamma: number) {
  if (Math.random() < gamma) {
    return selectRandomAction();
  } else {
    // TODO: predict
    return selectRandomAction();
  }
}

type Env = {
  player: Battler;
  enemy: Battler;
};

function buildModel() {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 20, activation: "relu", inputShape: [3, 4, 4] })
  );
  model.add(tf.layers.flatten());
  model.add(
    tf.layers.dense({
      units: 20,
      activation: "relu",
      inputShape: [1]
    })
  );
  model.add(
    tf.layers.dense({
      units: 20,
      activation: "relu"
    })
  );
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "linear"
    })
  );

  model.compile({ optimizer: "sgd", loss: "meanSquaredError" });
  return model;
}

type Memory = {
  inputs: number[];
  result: [boolean, number]; // done, reward
};

class DQNSolver {
  memory: Memory[];
  epsilon: number;
  model: Sequential;

  constructor(model: Sequential) {
    this.memory = [];
    this.epsilon = 1.0;
    this.model = model;
  }

  rememberMemory(env: Env, action: ActionData, done: boolean, reward: number) {
    this.memory.push({
      inputs: [
        env.player.life,
        env.player.cooldown,
        env.player.charge,
        env.enemy.life,
        env.enemy.cooldown,
        env.enemy.charge,
        env.enemy.defence,
        ...serializeAction(action)
      ],
      result: [true, reward]
    });
  }

  chooseAction() {
    if (this.epsilon < Math.random()) {
      return this.chooseRandomAction();
    } else {
      // TODO
      return this.chooseBestAction();
    }
  }

  chooseRandomAction() {
    return Math.floor(Math.random() * 4);
  }

  chooseBestAction() {
    // TODO
    return Math.floor(Math.random() * 4);
  }

  getReward(env: Env) {
    // enemy dead
    if (env.enemy.life <= 0) {
      return 1000;
    }

    // player dead penalty
    if (env.player.life <= 0) {
      return -1000;
    }

    // better
    if (env.player.life >= env.enemy.life) {
      return 1;
    }
    return 0;
  }

  replayExperience(batchSize: number = 32) {
    const batchSize_ = Math.min(batchSize, this.memory.length);
    const minibatch = sampleSize(this.memory, batchSize_);

    const xs = [];
    const ys = [];

    for (const i in range(batchSize_)) {
      const { inputs, result } = minibatch[i];

      const [done, reward] = result;
      let targetF = reward;

      if (!done) {
        const rewards: number[] = $actionData.map(a => {
          // TODO: predict
          // return this.model.predict([]);
          const pred: any = this.model.predict([]);
          return pred.dataSync()[0];
        });
        const maxReward = Math.max(...rewards);
        targetF = reward + REWARD_GAMMA * maxReward;
      }

      xs.push(inputs);
      ys.push(targetF);
    }

    this.model.fit(tf.tensor2d(xs), tf.tensor2d(ys), {
      epochs: 1
      // callbacks: {
      //   onEpochEnd: async (epoch: any, log: any) => {
      //     console.log(`Epoch ${epoch}: loss = ${log.loss}`);
      //   }
      // }
    });

    // Decay epsilon
    if (this.epsilon > EPSILON_MIN) {
      this.epsilon *= EPSILON_DECAY;
    }
  }
}

function execBattleSession(gamma: number = 1.0) {
  let env: Env = {
    player: createBattler(PLAYER_ID),
    enemy: createBattler(ENEMY_ID)
  };

  let winnerId = null;
  while (true) {
    const battlers = [env.player, env.enemy];
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
        const aid = selectAction(gamma);
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
              console.log(
                `> ${other.id}'s life: ${beforeLife} -> ${other.life}`
              );
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

    if (battlers.some(b => b.life <= 0)) {
      const winner = battlers.find(b => b.life > 0);
      if (winner) {
        winnerId = winner.id;
        break;
      }
    }

    // return [env, null];
  }

  console.log("winner", winnerId);
}

execBattleSession();
