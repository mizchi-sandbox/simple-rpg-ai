import * as tf from "@tensorflow/tfjs";

export default function buildModel() {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 128, activation: "relu", inputShape: [7] })
  );
  model.add(
    tf.layers.dense({
      units: 128,
      activation: "relu"
      // inputShape: [1]
    })
  );
  model.add(
    tf.layers.dense({
      units: 128,
      activation: "relu"
    })
  );
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "linear"
    })
  );

  model.compile({
    optimizer: tf.train.rmsprop(0.0001),
    loss: "meanSquaredError"
  });
  return model;
}
