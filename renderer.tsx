import "bootstrap/dist/css/bootstrap.min.css"
import {ipcRenderer} from "electron"
import React, {useEffect, useState} from "react"
import ReactDom from "react-dom"
import TitleBar from "./components/TitleBar"
import NavBar from "./components/NavBar"
import Footer from "./components/Footer"
import DragAndDrop from "./components/DragAndDrop"
import VersionDialog from "./components/VersionDialog"
import RainbowOptions from "./components/RainbowOptions"
import RainbowImage from "./components/RainbowImage"
import PixelShiftImage from "./components/PixelShiftImage"
import PointImage from "./components/PointImage"
import HighContrastImage from "./components/HighContrastImage"
import PixelationImage from "./components/PixelationImage"
import EdgeBlurImage from "./components/EdgeBlurImage"
import NoiseImage from "./components/NoiseImage"
import SprinkleImage from "./components/SprinkleImage"
import NetworkRandomizer from "./components/NetworkRandomizer"
import NetworkShifter from "./components/NetworkShifter"
import Conversion from "./components/Conversion"
import Inflation from "./components/Inflation"
import Fence from "./components/Fence"
import AdversarialNoise from "./components/AdversarialNoise"
import CRT from "./components/CRT"
import RGBSplit from "./components/RGBSplit"
import AIWatermark from "./components/AIWatermark"
import Steganography from "./components/Steganography"
import InvisibleWatermark from "./components/InvisibleWatermark"
import CLIPBreaker from "./components/CLIPBreaker"
import GlyphSwap from "./components/GlyphSwap"
import TextSpoof from "./components/TextSpoof"
import Bitcrush from "./components/Bitcrush"
import PitchShift from "./components/PitchShift"
import BlockReverse from "./components/BlockReverse"
import PinkNoise from "./components/PinkNoise"
import Decimation from "./components/Decimation"
import Subdivision from "./components/Subdivision"
import "./index.less"

export const MobileContext = React.createContext<any>(null)
export const EnableDragContext = React.createContext<any>(null)
export const ImageContext = React.createContext<any>(null)
export const WatermarkImageContext = React.createContext<any>(null)
export const TextContext = React.createContext<any>(null)
export const FontContext = React.createContext<any>(null)
export const BlendModeContext = React.createContext<any>(null)
export const OpacityContext = React.createContext<any>(null)
export const SizeContext = React.createContext<any>(null)
export const AngleContext = React.createContext<any>(null)
export const MarginContext = React.createContext<any>(null)
export const SpeedContext = React.createContext<any>(null)
export const ImageNameContext = React.createContext<any>(null)
export const ReverseContext = React.createContext<any>(null)
export const HueContext = React.createContext<any>(null)
export const SaturationContext = React.createContext<any>(null)
export const BrightnessContext = React.createContext<any>(null)
export const ColorStopContext = React.createContext<any>(null)
export const StopAnimationContext = React.createContext<any>(null)
export const PixelateContext = React.createContext<any>(null)
export const TypeContext = React.createContext<any>(null)
export const VarianceContext = React.createContext<any>(null)
export const PatternContext = React.createContext<any>(null)
export const OutputSizeContext = React.createContext<any>(null)
export const RotationSpeedContext = React.createContext<any>(null)
export const HighCoverageContext = React.createContext<any>(null)
export const ImbalanceContext = React.createContext<any>(null)
export const PosXContext = React.createContext<any>(null)
export const PosYContext = React.createContext<any>(null)
export const AttackModeContext = React.createContext<any>(null)
export const ImagePathContext = React.createContext<any>(null)

export const SiteHueContext = React.createContext<any>(null)
export const SiteSaturationContext = React.createContext<any>(null)
export const SiteLightnessContext = React.createContext<any>(null)

export const AudioContext = React.createContext<any>(null)
export const AudioNameContext = React.createContext<any>(null)
export const AudioSpeedContext = React.createContext<any>(null)
export const AudioReverseContext = React.createContext<any>(null)
export const SourceNodeContext = React.createContext<any>(null)
export const EffectNodeContext = React.createContext<any>(null)
export const SecondsProgressContext = React.createContext<any>(null)
export const ProgressContext = React.createContext<any>(null)
export const VolumeContext = React.createContext<any>(null)
export const PreviousVolumeContext = React.createContext<any>(null)
export const PauseContext = React.createContext<any>(null)
export const PreservesPitchContext = React.createContext<any>(null)
export const DurationContext = React.createContext<any>(null)
export const OriginalDurationContext = React.createContext<any>(null)
export const StartTimeContext = React.createContext<any>(null)
export const ElapsedTimeContext = React.createContext<any>(null)
export const SeekToContext = React.createContext<any>(null)
export const ReverseActiveContext = React.createContext<any>(null)
export const UpdateEffectContext = React.createContext<any>(null)
export const SavedTimeContext = React.createContext<any>(null)

export const ModelContext = React.createContext<any>(null)
export const MTLContext = React.createContext<any>(null)
export const TexturesContext = React.createContext<any>(null)
export const TextureNamesContext = React.createContext<any>(null)
export const ModelNameContext = React.createContext<any>(null)

import square from "./assets/patterns/square.svg"
import circle from "./assets/patterns/circle.svg"
import asterisk from "./assets/patterns/asterisk.svg"
import star from "./assets/patterns/star.svg"
import cross from "./assets/patterns/cross.svg"
import zigzag from "./assets/patterns/zigzag.svg"

export const patterns = [
    {name: "square", image: square},
    {name: "circle", image: circle},
    {name: "asterisk", image: asterisk},
    {name: "star", image: star},
    {name: "cross", image: cross},
    {name: "zigzag", image: zigzag},
]

export const defaultColorStops = [
    {position: 0, color: "#ff4141"},
    {position: 0.125, color: "#e252e0"},
    {position: 0.250, color: "#9952e2"},
    {position: 0.375, color: "#5266e2"},
    {position: 0.5, color: "#52c9e2"},
    {position: 0.625, color: "#52e28c"},
    {position: 0.750, color: "#c9e252"},
    {position: 0.875, color: "#e29952"},
    {position: 1, color: "#ff3434"}
]

let audioContext = new window.AudioContext()

const App = () => {
  const [mobile, setMobile] = useState(false)
  const [enableDrag, setEnableDrag] = useState(false)
  const [siteHue, setSiteHue] = useState(189)
  const [siteSaturation, setSiteSaturation] = useState(100)
  const [siteLightness, setSiteLightness] = useState(50)
  const [image, setImage] = useState("")
  const [watermarkImage, setWatermarkImage] = useState("")
  const [text, setText] = useState("Sample")
  const [font, setFont] = useState("dotness")
  const [blendMode, setBlendMode] = useState("source-over")
  const [opacity, setOpacity] = useState(0.5)
  const [size, setSize] = useState(20)
  const [angle, setAngle] = useState(45)
  const [margin, setMargin] = useState(25)
  const [speed, setSpeed] = useState(75)
  const [imageName, setImageName] = useState("")
  const [reverse, setReverse] = useState(false)
  const [saturation, setSaturation] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [pixelate, setPixelate] = useState(1)
  const [variance, setVariance] = useState(0)
  const [colorStops, setColorStops] = useState(defaultColorStops)
  const [stopAnimations, setStopAnimations] = useState(false)
  const [pattern, setPattern] = useState("square")
  const [type, setType] = useState("text")
  const [outputSize, setOutputSize] = useState(100)
  const [rotationSpeed, setRotationSpeed] = useState(1)
  const [highCoverage, setHighCoverage] = useState(false)
  const [imbalance, setImbalance] = useState(0)
  const [hue, setHue] = useState(0)
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [attackMode, setAttackMode] = useState("rainbow watermarks")
  const [imagePath, setImagePath] = useState("")
  const [audio, setAudio] = useState("")
  const [audioName, setAudioName] = useState("")
  const [audioSpeed, setAudioSpeed] = useState(1)
  const [audioReverse, setAudioReverse] = useState(false)
  const [sourceNode, setSourceNode] = useState(null)
  const [effectNode, setEffectNode] = useState(null)
  const [secondsProgress, setSecondsProgress] = useState(0)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [previousVolume, setPreviousVolume] = useState(0)
  const [paused, setPaused] = useState(true)
  const [preservesPitch, setPreservesPitch] = useState(true)
  const [duration, setDuration] = useState(0)
  const [originalDuration, setOriginalDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [seekTo, setSeekTo] = useState(null) as any
  const [reverseActive, setReverseActive] = useState(false)
  const [updateEffect, setUpdateEffect] = useState(false)
  const [savedTime, setSavedTime] = useState(0)
  const [model, setModel] = useState("")
  const [mtl, setMTL] = useState("")
  const [textures, setTextures] = useState([])
  const [textureNames, setTextureNames] = useState([])
  const [modelName, setModelName] = useState("")
  
  useEffect(() => {
    ipcRenderer.on("debug", console.error)
  }, [])

  const getAttack = () => {
    if (attackMode === "rainbow watermarks") {
        return (<><RainbowOptions/><RainbowImage/></>)
    } else if (attackMode === "pointifiction") {
        return (<PointImage/>)
    } else if (attackMode === "pixel shift") {
      return (<PixelShiftImage/>)
    } else if (attackMode === "high contrast") {
      return (<HighContrastImage/>)
    } else if (attackMode === "pixelation") {
        return (<PixelationImage/>)
    } else if (attackMode === "noise") {
      return (<NoiseImage/>)
    } else if (attackMode === "sprinkles") {
      return (<SprinkleImage/>)
    } else if (attackMode === "edge blur") {
      return (<EdgeBlurImage/>)
    } else if (attackMode === "network randomizer") {
      return (<NetworkRandomizer/>)
    } else if (attackMode === "network shifter") {
      return (<NetworkShifter/>)
    } else if (attackMode === "conversion") {
      return (<Conversion/>)
    } else if (attackMode === "inflation") {
      return (<Inflation/>)
    } else if (attackMode === "fence") {
      return (<Fence/>)
    } else if (attackMode === "adversarial noise") {
      return (<AdversarialNoise/>)
    } else if (attackMode === "ai watermark") {
      return (<AIWatermark/>)
    } else if (attackMode === "crt") {
      return (<CRT/>)
    } else if (attackMode === "rgb split") {
      return (<RGBSplit/>)
    } else if (attackMode === "steganography") {
      return (<Steganography/>)
    } else if (attackMode === "invisible watermark") {
      return (<InvisibleWatermark/>)
    } else if (attackMode === "clip breaker") {
      return (<CLIPBreaker/>)
    } else if (attackMode === "glyph swap") {
      return (<GlyphSwap/>)
    } else if (attackMode === "text spoof") {
        return (<TextSpoof/>)
    } else if (attackMode === "bitcrush") {
        return (<Bitcrush audioContext={audioContext}/>)
    } else if (attackMode === "pitch shift") {
        return (<PitchShift audioContext={audioContext}/>)
    } else if (attackMode === "block reverse") {
        return (<BlockReverse audioContext={audioContext}/>)
    } else if (attackMode === "pink noise") {
      return (<PinkNoise audioContext={audioContext}/>)
    } else if (attackMode === "decimation") {
      return (<Decimation/>)
    } else if (attackMode === "subdivision") {
      return (<Subdivision/>)
    }
  }

  return (
    <main className="app">
            <TextureNamesContext.Provider value={{textureNames, setTextureNames}}>
            <TexturesContext.Provider value={{textures, setTextures}}>
            <MTLContext.Provider value={{mtl, setMTL}}>
            <ModelNameContext.Provider value={{modelName, setModelName}}>
            <ModelContext.Provider value={{model, setModel}}>
            <MobileContext.Provider value={{mobile, setMobile}}>
            <EnableDragContext.Provider value={{enableDrag, setEnableDrag}}>
            <EffectNodeContext.Provider value={{effectNode, setEffectNode}}>
            <SiteLightnessContext.Provider value={{siteLightness, setSiteLightness}}>
            <SiteSaturationContext.Provider value={{siteSaturation, setSiteSaturation}}>
            <SiteHueContext.Provider value={{siteHue, setSiteHue}}>
            <OriginalDurationContext.Provider value={{originalDuration, setOriginalDuration}}>
            <SavedTimeContext.Provider value={{savedTime, setSavedTime}}>
            <UpdateEffectContext.Provider value={{updateEffect, setUpdateEffect}}>
            <ReverseActiveContext.Provider value={{reverseActive, setReverseActive}}>
            <SeekToContext.Provider value={{seekTo, setSeekTo}}>
            <ElapsedTimeContext.Provider value={{elapsedTime, setElapsedTime}}>
            <StartTimeContext.Provider value={{startTime, setStartTime}}>
            <DurationContext.Provider value={{duration, setDuration}}>
            <PreservesPitchContext.Provider value={{preservesPitch, setPreservesPitch}}>
            <PauseContext.Provider value={{paused, setPaused}}>
            <PreviousVolumeContext.Provider value={{previousVolume, setPreviousVolume}}>
            <VolumeContext.Provider value={{volume, setVolume}}>
            <ProgressContext.Provider value={{progress, setProgress}}>
            <SecondsProgressContext.Provider value={{secondsProgress, setSecondsProgress}}>
            <SourceNodeContext.Provider value={{sourceNode, setSourceNode}}>
            <AudioReverseContext.Provider value={{audioReverse, setAudioReverse}}>
            <AudioSpeedContext.Provider value={{audioSpeed, setAudioSpeed}}>
            <AudioNameContext.Provider value={{audioName, setAudioName}}>
            <AudioContext.Provider value={{audio, setAudio}}>
            <ImagePathContext.Provider value={{imagePath, setImagePath}}>
            <AttackModeContext.Provider value={{attackMode, setAttackMode}}>
            <PosYContext.Provider value={{posY, setPosY}}>
            <PosXContext.Provider value={{posX, setPosX}}>
            <HueContext.Provider value={{hue, setHue}}>
            <ImbalanceContext.Provider value={{imbalance, setImbalance}}>
            <HighCoverageContext.Provider value={{highCoverage, setHighCoverage}}>
            <RotationSpeedContext.Provider value={{rotationSpeed, setRotationSpeed}}>
            <OutputSizeContext.Provider value={{outputSize, setOutputSize}}>
            <PatternContext.Provider value={{pattern, setPattern}}>
            <VarianceContext.Provider value={{variance, setVariance}}>
            <TypeContext.Provider value={{type, setType}}>
            <PixelateContext.Provider value={{pixelate, setPixelate}}>
            <StopAnimationContext.Provider value={{stopAnimations, setStopAnimations}}>
            <BrightnessContext.Provider value={{brightness, setBrightness}}>
            <SaturationContext.Provider value={{saturation, setSaturation}}>
            <ColorStopContext.Provider value={{colorStops, setColorStops}}>
            <ReverseContext.Provider value={{reverse, setReverse}}>
            <ImageNameContext.Provider value={{imageName, setImageName}}>
            <SpeedContext.Provider value={{speed, setSpeed}}>
            <MarginContext.Provider value={{margin, setMargin}}>
            <AngleContext.Provider value={{angle, setAngle}}>
            <SizeContext.Provider value={{size, setSize}}>
            <OpacityContext.Provider value={{opacity, setOpacity}}>
            <BlendModeContext.Provider value={{blendMode, setBlendMode}}>
            <FontContext.Provider value={{font, setFont}}>
            <TextContext.Provider value={{text, setText}}>
            <WatermarkImageContext.Provider value={{watermarkImage, setWatermarkImage}}>
            <ImageContext.Provider value={{image, setImage}}>
                <DragAndDrop/>
                <TitleBar/>
                <NavBar/>
                <VersionDialog/>
                <div className="body">
                    {getAttack()}
                </div>
                <Footer/>
            </ImageContext.Provider>
            </WatermarkImageContext.Provider>
            </TextContext.Provider>
            </FontContext.Provider>
            </BlendModeContext.Provider>
            </OpacityContext.Provider>
            </SizeContext.Provider>
            </AngleContext.Provider>
            </MarginContext.Provider>
            </SpeedContext.Provider>
            </ImageNameContext.Provider>
            </ReverseContext.Provider>
            </ColorStopContext.Provider>
            </SaturationContext.Provider>
            </BrightnessContext.Provider>
            </StopAnimationContext.Provider>
            </PixelateContext.Provider>
            </TypeContext.Provider>
            </VarianceContext.Provider>
            </PatternContext.Provider>
            </OutputSizeContext.Provider>
            </RotationSpeedContext.Provider>
            </HighCoverageContext.Provider>
            </ImbalanceContext.Provider>
            </HueContext.Provider>
            </PosXContext.Provider>
            </PosYContext.Provider>
            </AttackModeContext.Provider>
            </ImagePathContext.Provider>
            </AudioContext.Provider>
            </AudioNameContext.Provider>
            </AudioSpeedContext.Provider>
            </AudioReverseContext.Provider>
            </SourceNodeContext.Provider>
            </SecondsProgressContext.Provider>
            </ProgressContext.Provider>
            </VolumeContext.Provider>
            </PreviousVolumeContext.Provider>
            </PauseContext.Provider>
            </PreservesPitchContext.Provider>
            </DurationContext.Provider>
            </StartTimeContext.Provider>
            </ElapsedTimeContext.Provider>
            </SeekToContext.Provider>
            </ReverseActiveContext.Provider>
            </UpdateEffectContext.Provider>
            </SavedTimeContext.Provider>
            </OriginalDurationContext.Provider>
            </SiteHueContext.Provider>
            </SiteSaturationContext.Provider>
            </SiteLightnessContext.Provider>
            </EffectNodeContext.Provider>
            </EnableDragContext.Provider>
            </MobileContext.Provider>
            </ModelContext.Provider>
            </ModelNameContext.Provider>
            </MTLContext.Provider>
            </TexturesContext.Provider>
            </TextureNamesContext.Provider>
    </main>
  )
}

ReactDom.render(<App/>, document.getElementById("root"))
