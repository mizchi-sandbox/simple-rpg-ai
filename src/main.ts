import "@babel/polyfill";
import {
  Env,
  processTurn,
  createEnv,
  judgeWinner,
  PLAYER_ID,
  ENEMY_ID
} from "./env";
import Trainer from "./Trainer";
import { range } from "lodash";

const EPISODE_COUNT = 10000;
const MAX_TURN_COUNT = 500;

async function runWithTrainer(trainer: Trainer) {
  for (const e of range(EPISODE_COUNT)) {
    let env: Env = createEnv();
    let winnerId = null;

    let score = 0;

    for (const _t in range(MAX_TURN_COUNT)) {
      let playerActionId = null;
      const nenv = processTurn(env, {
        onSelectAction(battlerId: number) {
          // return trainer.chooseRandomAction();
          if (battlerId === PLAYER_ID) {
            playerActionId = trainer.chooseAction(env);
            return playerActionId;
          }
          return trainer.chooseRandomAction();
        }
      });

      winnerId = judgeWinner(nenv);

      if (playerActionId) {
        if (winnerId === PLAYER_ID) {
          score += 50 + env.player.life * 2;
        } else if (winnerId === ENEMY_ID) {
          score -= 100;
        } else {
          const reward = trainer.getActionReward(env, playerActionId);
          score = reward + score;
          trainer.rememberMemory(env, PLAYER_ID, playerActionId, score);
        }
      }

      if (winnerId != null) {
        break;
      }

      env = nenv;
    }
    await trainer.replayExperience(64, e);
  }
}

async function runWithTrainedModel(trainer: Trainer) {
  for (const _e of range(2)) {
    let env: Env = createEnv();
    let winnerId = null;

    for (const _t in range(MAX_TURN_COUNT)) {
      const nenv = processTurn(
        env,
        {
          onSelectAction(battlerId: number) {
            if (battlerId === PLAYER_ID) {
              return trainer.chooseBestAction(env);
            }
            return trainer.chooseRandomAction();
          }
        },
        true
      );

      winnerId = judgeWinner(nenv);

      if (winnerId != null) {
        break;
      }
      env = nenv;
    }
  }
}

const trainer = new Trainer();

const main = async () => {
  await runWithTrainer(trainer);
  console.log("---- trained");
  // Trained
  await runWithTrainedModel(trainer);
};

main();
