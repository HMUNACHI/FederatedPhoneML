// index.ts

import { runTraining } from './Training';
import { runEvaluation } from './Evaluation';
import { runPrediction } from './Prediction';
import { runDiagnositics } from './Diagnostics';

export async function train(config: any) {
  return await runTraining(config);
}

export async function evaluate(config: any) {
  return await runEvaluation(config);
}

export async function predict(config: any) {
  return await runPrediction(config);
}

export async function isAvailable() {
  return await runDiagnositics();
}