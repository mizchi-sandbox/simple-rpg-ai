import "@babel/polyfill";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-node-gpu";

function buildModel() {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 20, activation: "relu", inputShape: [2] })
  );
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

const fn = (a: number, b: number) => {
  const n = Math.cos(a * Math.PI * 2) * b + Math.sin(b * Math.PI * 2) * a;
  return a > b ? n : -n;
};

function train(model: tf.Sequential, count: number = 200000) {
  // create data
  const inputs: number[][] = new Array(count)
    .fill(0)
    .map(_ => [Math.random(), Math.random()]);
  const answers: number[][] = inputs.map(x => [fn(x[0], x[1])]);

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(answers);

  return model.fit(xs, ys, {
    epochs: 100,
    callbacks: {
      onEpochEnd: async (epoch: any, log: any) => {
        console.log(`Epoch ${epoch}: loss = ${log.loss}`);
      }
    }
  });
}

async function run() {
  const model = buildModel();

  await train(model);

  console.log("--- use trained model");
  new Array(10).fill(0).forEach(() => {
    const input = [Math.random(), Math.random()];
    const pred: any = model.predict(tf.tensor2d([input]));
    const real = fn(input[0], input[1]);
    console.log("in", input, "pred", pred.dataSync()[0], "real", real);
  });
}

run();
