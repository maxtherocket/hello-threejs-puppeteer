import '../src/style/index.scss';
import MainCanvas from "./three/MainCanvas";
import {useTweaks} from "use-tweaks/src/useTweaks";
import {makeButton} from "use-tweaks";
import {Howl} from 'howler'
import {useMemo} from 'react';
import trackPath from '../src/assets/tokyo-knight.mp3'

export default function App() {

  const track = useMemo(() => {
    return new Howl({
      src: trackPath
    })
  }, [])

  useTweaks('Audio', {
    ...makeButton('Play', () => {
      track.play();
    }),
    ...makeButton('Stop', () => {
      track.stop();
    })
  })

  return (
    <div className="canvas-container">
      <MainCanvas />
    </div>
  )
}
