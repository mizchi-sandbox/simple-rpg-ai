import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-node-gpu";
import { range, sampleSize } from "lodash";
import { $actionData, ActionData, Env } from "./env";

const REWARD_GAMMA = 0.9;
const EPSILON_MIN = 0.01;
const EPSILON_DECAY = 0.9999;

type Memory = {
  inputs: number[];
  result: [boolean, number]; // done, reward
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

export function buildModel() {
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

export function serializeAction(data: ActionData): number[] {
  return [data.damage, data.defence, data.cooldown, data.charge];
}

export function selectRandomAction() {
  return Math.floor(Math.random() * 4);
}
