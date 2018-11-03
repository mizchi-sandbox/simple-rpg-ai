import "@babel/polyfill";
import { Env, processTurn, createEnv, judgeWinner } from "./env";
import Trainer from "./Trainer";

function execSession() {
  const trainer = new Trainer();

  let env: Env = createEnv();

  let winnerId = null;

  while (true) {
    env = processTurn(env, (_battelrId: number) =>
      trainer.chooseRandomAction()
    );
    winnerId = judgeWinner(env);
    if (winnerId != null) {
      break;
    }
  }

  console.log("winner", winnerId);
}

execSession();
