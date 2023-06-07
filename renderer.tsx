import "bootstrap/dist/css/bootstrap.min.css"
import {ipcRenderer} from "electron"
import React, {useEffect, useState} from "react"
import ReactDom from "react-dom"
import TitleBar from "./components/TitleBar"
import NavBar from "./components/NavBar"
import Footer from "./components/Footer"
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
import "./index.less"

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
export const PointSpacingContext = React.createContext<any>(null)
export const PointSizeContext = React.createContext<any>(null)
export const PointRandomnessContext = React.createContext<any>(null)
export const PointBrightnessContext = React.createContext<any>(null)
export const PointContrastContext = React.createContext<any>(null)
export const PointMethodContext = React.createContext<any>(null)
export const PointInvertContext = React.createContext<any>(null)
export const PixelShiftContext = React.createContext<any>(null)
export const PixelShiftSizeContext = React.createContext<any>(null)
export const PixelShiftDirectionContext = React.createContext<any>(null)
export const HighContrastStrengthContext = React.createContext<any>(null)
export const HighContrastSizeContext = React.createContext<any>(null)
export const HighContrastBrightnessContext = React.createContext<any>(null)
export const HighContrastContrastContext = React.createContext<any>(null)
export const HighContrastInvertContext = React.createContext<any>(null)
export const HighContrastSpacingContext = React.createContext<any>(null)
export const PixelationStrengthContext = React.createContext<any>(null)
export const PixelationSizeContext = React.createContext<any>(null)
export const PointShiftContext = React.createContext<any>(null)
export const PointAngleContext = React.createContext<any>(null)
export const PointVarianceContext = React.createContext<any>(null)
export const NoiseAmountContext = React.createContext<any>(null)
export const NoiseSizeContext = React.createContext<any>(null)
export const NoiseSpacingContext = React.createContext<any>(null)
export const NoiseHueContext = React.createContext<any>(null)
export const NoiseSaturationContext = React.createContext<any>(null)
export const NoiseBrightnessContext = React.createContext<any>(null)
export const EdgeBlurRadiusContext = React.createContext<any>(null)
export const EdgeBlurEdgeRadiusContext = React.createContext<any>(null)
export const EdgeBlurSensitivityContext = React.createContext<any>(null)
export const EdgeBlurShowEdgesContext = React.createContext<any>(null)
export const PointFillContext = React.createContext<any>(null)
export const PointAlphaContext = React.createContext<any>(null)
export const SprinkleOpacityContext = React.createContext<any>(null)
export const SprinklePointSizeContext = React.createContext<any>(null)
export const SprinklePointSpacingContext = React.createContext<any>(null)
export const SprinkleDuplicatesContext = React.createContext<any>(null)
export const SprinkleSpacingContext = React.createContext<any>(null)
export const SprinkleDirectionContext = React.createContext<any>(null)
export const TriDirectionContext = React.createContext<any>(null)
export const PixelationOpacityContext = React.createContext<any>(null)
export const SVGColorRatioContext = React.createContext<any>(null)
export const SVGPreviewContext = React.createContext<any>(null)
export const AppendBytesContext = React.createContext<any>(null)

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

const App = () => {
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
  const [pointSpacing, setPointSpacing] = useState(0)
  const [pointRandomness, setPointRandomness] = useState(0)
  const [pointBrightness, setPointBrightness] = useState(0)
  const [pointContrast, setPointContrast] = useState(0)
  const [pointSize, setPointSize] = useState(1)
  const [pointMethod, setPointMethod] = useState("uniform")
  const [pointInvert, setPointInvert] = useState(false)
  const [pixelShift, setPixelShift] = useState(0)
  const [pixelShiftSize, setPixelShiftSize] = useState(13)
  const [pixelShiftDirection, setPixelShiftDirection] = useState("xy")
  const [highContrastStrength, setHighContrastStrength] = useState(0)
  const [highContrastSize, setHighContrastSize] = useState(1)
  const [highContrastBrightness, setHighContrastBrightness] = useState(0)
  const [highContrastContrast, setHighContrastContrast] = useState(0)
  const [highContrastInvert, setHighContrastInvert] = useState(false)
  const [highContrastSpacing, setHighContrastSpacing] = useState(1)
  const [pixelationStrength, setPixelationStrength] = useState(0)
  const [pixelationSize, setPixelationSize] = useState(1)
  const [pointShift, setPointShift] = useState(0)
  const [pointAngle, setPointAngle] = useState(0)
  const [pointVariance, setPointVariance] = useState(0)
  const [noiseAmount, setNoiseAmount] = useState(0)
  const [noiseSize, setNoiseSize] = useState(10)
  const [noiseSpacing, setNoiseSpacing] = useState(0)
  const [noiseHue, setNoiseHue] = useState(0)
  const [noiseSaturation, setNoiseSaturation] = useState(0)
  const [noiseBrightness, setNoiseBrightness] = useState(0)
  const [pixelateOpacity, setPixelateOpacity] = useState(0)
  const [edgeBlurRadius, setEdgeBlurRadius] = useState(10)
  const [edgeBlurEdgeRadius, setEdgeBlurEdgeRadius] = useState(3)
  const [edgeBlurSensitivity, setEdgeBlurSensitivity] = useState(20)
  const [edgeBlurShowEdges, setEdgeBlurShowEdges] = useState(false)
  const [pointFill, setPointFill] = useState("#000000")
  const [pointAlpha, setPointAlpha] = useState(true)
  const [sprinklePointSize, setSprinklePointSize] = useState(3)
  const [sprinklePointSpacing, setSprinklePointSpacing] = useState(100)
  const [sprinkleDuplicates, setSprinkleDuplicates] = useState(4)
  const [sprinkleSpacing, setSprinkleSpacing] = useState(35)
  const [sprinkleOpacity, setSprinkleOpacity] = useState(100)
  const [sprinkleDirection, setSprinkleDirection] = useState("45")
  const [triDirection, setTriDirection] = useState("△")
  const [pixelationOpacity, setPixelationOpacity] = useState(100)
  const [svgColorRatio, setSVGColorRatio] = useState(0)
  const [previewSVG, setPreviewSVG] = useState(false)
  const [appendBytes, setAppendBytes] = useState(10)
  
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
    }
  }

  return (
    <main className="app">
            <AppendBytesContext.Provider value={{appendBytes, setAppendBytes}}>
            <SVGPreviewContext.Provider value={{previewSVG, setPreviewSVG}}>
            <SVGColorRatioContext.Provider value={{svgColorRatio, setSVGColorRatio}}>
            <PixelationOpacityContext.Provider value={{pixelationOpacity, setPixelationOpacity}}>
            <TriDirectionContext.Provider value={{triDirection, setTriDirection}}>
            <SprinkleDirectionContext.Provider value={{sprinkleDirection, setSprinkleDirection}}>
            <SprinkleOpacityContext.Provider value={{sprinkleOpacity, setSprinkleOpacity}}>
            <SprinkleSpacingContext.Provider value={{sprinkleSpacing, setSprinkleSpacing}}>
            <SprinkleDuplicatesContext.Provider value={{sprinkleDuplicates, setSprinkleDuplicates}}>
            <SprinklePointSpacingContext.Provider value={{sprinklePointSpacing, setSprinklePointSpacing}}>
            <SprinklePointSizeContext.Provider value={{sprinklePointSize, setSprinklePointSize}}>
            <PointAlphaContext.Provider value={{pointAlpha, setPointAlpha}}>
            <PointFillContext.Provider value={{pointFill, setPointFill}}>
            <EdgeBlurShowEdgesContext.Provider value={{edgeBlurShowEdges, setEdgeBlurShowEdges}}>
            <EdgeBlurSensitivityContext.Provider value={{edgeBlurSensitivity, setEdgeBlurSensitivity}}>
            <EdgeBlurEdgeRadiusContext.Provider value={{edgeBlurEdgeRadius, setEdgeBlurEdgeRadius}}>
            <EdgeBlurRadiusContext.Provider value={{edgeBlurRadius, setEdgeBlurRadius}}>
            <NoiseBrightnessContext.Provider value={{noiseBrightness, setNoiseBrightness}}>
            <NoiseSaturationContext.Provider value={{noiseSaturation, setNoiseSaturation}}>
            <NoiseHueContext.Provider value={{noiseHue, setNoiseHue}}>
            <NoiseSpacingContext.Provider value={{noiseSpacing, setNoiseSpacing}}>
            <NoiseSizeContext.Provider value={{noiseSize, setNoiseSize}}>
            <NoiseAmountContext.Provider value={{noiseAmount, setNoiseAmount}}>
            <PointVarianceContext.Provider value={{pointVariance, setPointVariance}}>
            <PointAngleContext.Provider value={{pointAngle, setPointAngle}}>
            <PointShiftContext.Provider value={{pointShift, setPointShift}}>
            <PixelationSizeContext.Provider value={{pixelationSize, setPixelationSize}}>
            <PixelationStrengthContext.Provider value={{pixelationStrength, setPixelationStrength}}>
            <HighContrastSpacingContext.Provider value={{highContrastSpacing, setHighContrastSpacing}}>
            <HighContrastInvertContext.Provider value={{highContrastInvert, setHighContrastInvert}}>
            <HighContrastContrastContext.Provider value={{highContrastContrast, setHighContrastContrast}}>
            <HighContrastBrightnessContext.Provider value={{highContrastBrightness, setHighContrastBrightness}}>
            <HighContrastSizeContext.Provider value={{highContrastSize, setHighContrastSize}}>
            <HighContrastStrengthContext.Provider value={{highContrastStrength, setHighContrastStrength}}>
            <PixelShiftDirectionContext.Provider value={{pixelShiftDirection, setPixelShiftDirection}}>
            <PixelShiftSizeContext.Provider value={{pixelShiftSize, setPixelShiftSize}}>
            <PixelShiftContext.Provider value={{pixelShift, setPixelShift}}>
            <PointInvertContext.Provider value={{pointInvert, setPointInvert}}>
            <PointMethodContext.Provider value={{pointMethod, setPointMethod}}>
            <PointSizeContext.Provider value={{pointSize, setPointSize}}>
            <PointContrastContext.Provider value={{pointContrast, setPointContrast}}>
            <PointBrightnessContext.Provider value={{pointBrightness, setPointBrightness}}>
            <PointRandomnessContext.Provider value={{pointRandomness, setPointRandomness}}>
            <PointSpacingContext.Provider value={{pointSpacing, setPointSpacing}}>
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
            </PointSpacingContext.Provider>
            </PointRandomnessContext.Provider>
            </PointBrightnessContext.Provider>
            </PointContrastContext.Provider>
            </PointSizeContext.Provider>
            </PointMethodContext.Provider>
            </PointInvertContext.Provider>
            </PixelShiftContext.Provider>
            </PixelShiftSizeContext.Provider>
            </PixelShiftDirectionContext.Provider>
            </HighContrastStrengthContext.Provider>
            </HighContrastSizeContext.Provider>
            </HighContrastBrightnessContext.Provider>
            </HighContrastContrastContext.Provider>
            </HighContrastInvertContext.Provider>
            </HighContrastSpacingContext.Provider>
            </PixelationStrengthContext.Provider>
            </PixelationSizeContext.Provider>
            </PointShiftContext.Provider>
            </PointAngleContext.Provider>
            </PointVarianceContext.Provider>
            </NoiseAmountContext.Provider>
            </NoiseSizeContext.Provider>
            </NoiseSpacingContext.Provider>
            </NoiseHueContext.Provider>
            </NoiseSaturationContext.Provider>
            </NoiseBrightnessContext.Provider>
            </EdgeBlurRadiusContext.Provider>
            </EdgeBlurEdgeRadiusContext.Provider>
            </EdgeBlurSensitivityContext.Provider>
            </EdgeBlurShowEdgesContext.Provider>
            </PointFillContext.Provider>
            </PointAlphaContext.Provider>
            </SprinklePointSizeContext.Provider>
            </SprinklePointSpacingContext.Provider>
            </SprinkleDuplicatesContext.Provider>
            </SprinkleSpacingContext.Provider>
            </SprinkleOpacityContext.Provider>
            </SprinkleDirectionContext.Provider>
            </TriDirectionContext.Provider>
            </PixelationOpacityContext.Provider>
            </SVGColorRatioContext.Provider>
            </SVGPreviewContext.Provider>
            </AppendBytesContext.Provider>
    </main>
  )
}

ReactDom.render(<App/>, document.getElementById("root"))
