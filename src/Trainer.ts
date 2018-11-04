import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-node-gpu";
import buildModel from "./buildModel";
import { sampleSize, maxBy } from "lodash";
import {
  $actionData,
  ActionData,
  Env,
  applyActionToEnv,
  PLAYER_ID,
  judgeWinner
} from "./env";

const REWARD_GAMMA = 0.9;
const EPSILON_MIN = 0.05;
const EPSILON_DECAY = 0.9995;

type Memory = {
  env: Env;
  actorId: number;
  actionId: number;
  reward: number;
};

export default class Trainer {
  memory: Memory[];
  epsilon: number;
  model: tf.Sequential;

  constructor() {
    this.model = buildModel();
    this.memory = [];
    this.epsilon = 1.0;
  }

  rememberMemory(env: Env, actorId: number, actionId: number, reward: number) {
    this.memory.push({
      env,
      actorId,
      actionId,
      reward
    });
  }

  chooseAction(env: Env) {
    const e = Math.max(this.epsilon, EPSILON_MIN);
    if (e > Math.random()) {
      return this.chooseRandomAction();
    } else {
      return this.chooseBestAction(env);
    }
  }

  chooseRandomAction() {
    return Math.floor(Math.random() * $actionData.length);
  }

  chooseBestAction(env: Env, actorId: number = PLAYER_ID): number {
    // TODO

    // Filter canExec
    const ret = $actionData.map(action => {
      if (env.player.charge + action.charge >= 0) {
        const pred: any = this.model.predict([
          tf.tensor2d([serializeState(env, action)])
        ]);
        return {
          id: action.id,
          reward: pred.dataSync()[0]
        };
      }
      return {
        id: action.id,
        reward: -1
      };
    });
    const selected: any = maxBy(ret, i => i.reward);
    if (selected) {
      return selected.id;
    } else {
      return this.chooseRandomAction();
    }
  }

  // TODO Take actorId
  getEnvReward(env: Env): number {
    // enemy dead
    if (env.enemy.life <= 0) {
      return 100;
    }

    // player dead penalty
    if (env.player.life <= 0) {
      return -100;
    }

    return env.player.life >= env.enemy.life ? +1 : -1;
  }

  // TODO Take actorId
  getActionReward(env: Env, actionId: number): number {
    const nextEnv = applyActionToEnv(env, PLAYER_ID, actionId);
    if (nextEnv.enemy.life <= 0) {
      return 100;
    }

    if (env.enemy.life > nextEnv.enemy.life) {
      return 1;
    }
    return 0;
    // return this.getEnvReward(nextEnv);
  }

  async replayExperience(defaultBatchSize: number = 32, count: number) {
    const batchSize = Math.min(defaultBatchSize, this.memory.length);
    const minibatch = sampleSize(this.memory, batchSize);

    const xs = [];
    const ys = [];

    for (const memory of minibatch) {
      const nextEnv = applyActionToEnv(
        memory.env,
        memory.actorId,
        memory.actionId
      );
      const reward = memory.reward;
      const winnerId = judgeWinner(nextEnv);

      let targetF = memory.reward;

      if (winnerId == null) {
        const rewards: number[] = $actionData.map(a => {
          const predictedEnv = applyActionToEnv(nextEnv, PLAYER_ID, a.id);
          const action = $actionData[a.id];
          const pred: any = this.model.predict(
            tf.tensor2d([serializeState(predictedEnv, action)])
          );
          return pred.dataSync()[0];
        });
        const maxReward = Math.max(...rewards);
        targetF = reward + REWARD_GAMMA * maxReward;
      }

      xs.push(serializeState(nextEnv, $actionData[memory.actionId]));
      ys.push([targetF]);
    }

    await this.model.fit(tf.tensor2d(xs), tf.tensor2d(ys), {
      epochs: 1,
      verbose: 0,
      callbacks: {
        onEpochEnd: async (epoch: any, log: any) => {
          if (count % 500 === 0) {
            console.log(
              `loss=${Math.floor(log.loss * 1000) / 1000} | ε=${
                this.epsilon
              } | ${count}`
            );
          }
        }
      }
    });

    // Decay epsilon
    if (this.epsilon > EPSILON_MIN) {
      this.epsilon *= EPSILON_DECAY;
    }
  }
}

function serializeState(env: Env, action: ActionData): number[] {
  return [...serializeEnv(env), ...serializeAction(action.id)];
}

type SeriarizedAction = [
  // number /* actionId */
  number /* damage */,
  number /* defence */,
  number /* cooldown */,
  number /* charge */
];

function serializeAction(actionId: number): SeriarizedAction {
  // return [actionId];
  const data = $actionData[actionId];
  return [data.damage, data.defence, data.cooldown, data.charge];
}

type SeriarizedEnv = [
  // number /* self.life */,
  // number /* self.cooldown */,
  number /* self.charge */,
  // number /* other.life */,
  number /* other.cooldown */,
  number /* other.charge */,
  number /* other.defence */
];

function serializeEnv(env: Env): SeriarizedEnv {
  return [
    // env.player.life,
    // env.player.cooldown,
    env.player.charge,
    // env.enemy.life,
    env.enemy.cooldown,
    env.enemy.charge,
    env.enemy.defence
  ];
}
