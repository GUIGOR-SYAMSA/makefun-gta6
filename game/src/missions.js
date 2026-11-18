export const STORY = {
  intro: 'Rook knows every road in Solmar, a sunlit coastal city with a long memory. Mara runs the quiet business behind its bright storefronts. She has a first favor that needs a steady driver.',
  jobs: [
    { title: 'FIRST PICKUP', call: 'Rook, there is a parcel waiting by the old market. Drive in close and bring it aboard.', objective: 'Pick up Mara’s package', point: { x: -80, z: 0 }, phase: 'pickup', reward: 450 },
    { title: 'THE DROP', call: 'Rook, pick up the next parcel at the old market, then take it to the marina. The handoff will draw heat.', objective: 'Pick up the package', point: { x: -80, z: 0 }, phase: 'pickup', reward: 700 },
    { title: 'LOSE THEM', call: 'They have your plate. Keep moving until the sirens fade and the heat is gone.', objective: 'Lose the police', point: null, phase: 'escape', reward: 900 },
  ],
  repeat: { title: 'ANOTHER RUN', call: 'I have another parcel and a clean address. Same arrangement as before.', objective: 'Pick up the package', phase: 'pickup', reward: 500 },
  done: 'JOB DONE',
};

export function freshMissions(saved = {}) {
  return { stage: Number.isInteger(saved.stage) ? Math.max(0, Math.min(3, saved.stage)) : 0, complete: !!saved.complete, active: !!saved.active, point: saved.point || null, phase: saved.phase || '', reward: saved.reward || 0, repeatIndex: saved.repeatIndex || 0, callAt: saved.callAt || 0 };
}

export function missionDefinition(state) {
  if (state.stage < 3) return STORY.jobs[state.stage];
  return STORY.repeat;
}
