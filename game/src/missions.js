// Mara's voice and the three runs that make Rook's name in Solmar.
export const STORY = {
  jobs: [
    { title: 'FIRST PICKUP', call: 'Rook, a parcel is waiting by the old market. Drive close and bring it aboard.', pickup: [-80, 0], reward: 450 },
    { title: 'THE DROP', call: 'Take the parcel from the old market to the marina. The handoff will draw heat.', pickup: [-80, 0], drop: [80, -80], reward: 700 },
    { title: 'LOSE THEM', call: 'They have your plate. Keep moving until the sirens fade and the heat is gone.', reward: 900 },
    { title: 'THE SCORE', call: 'Last one, Rook. Marina pickup, old market drop. Make it clean and we are square.', pickup: [80, -80], drop: [-80, 0], reward: 1200 },
  ],
  repeat: { title: 'ANOTHER RUN', call: 'I have another parcel and a clean address. Same arrangement as before.', pickup: [-80, 0], drop: [80, -80], reward: 500 },
};

export function freshMissions(value = {}) {
  return { stage: Number.isInteger(value.stage) ? Math.max(0, Math.min(4, value.stage)) : 0, phase: value.phase || 'waiting', point: value.point || null, reward: Number(value.reward) || 0, callUntil: 0, nextAt: 0, doneText: '', doneUntil: 0, repeatNo: Number(value.repeatNo) || 0 };
}

export function missionFor(state) { return state.stage < 4 ? STORY.jobs[state.stage] : STORY.repeat; }
