import {Howler} from 'howler';

export function createAnalyser(fftSize = 128){
  // Create an analyser node in the Howler WebAudio context
  const analyser = Howler.ctx.createAnalyser();
  analyser.fftSize = fftSize;
// Connect the masterGain -> analyser (disconnecting masterGain -> destination)
  Howler.masterGain.connect(analyser);
// Connect the analyser -> destination
  analyser.connect(Howler.ctx.destination);
  return analyser;
};
