import {Howler} from 'howler';
import {useEffect, useMemo, useState} from "react";

let _analyzer = null;

export default function useAudioAnalyzer(){

  const [audioAnalyzer, setAudioAnalyzer] = useState(_analyzer);

  useEffect(() => {
    if (!_analyzer) {
      // Create an analyser node in the Howler WebAudio context
      const analyser = Howler.ctx.createAnalyser();
      analyser.fftSize = 128;
      // Connect the masterGain -> analyser (disconnecting masterGain -> destination)
      Howler.masterGain.connect(analyser);
      // Connect the analyser -> destination
      analyser.connect(Howler.ctx.destination);
      setAudioAnalyzer(analyser);
    }
  }, [])

  return audioAnalyzer;
}
