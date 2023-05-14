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
  
  useEffect(() => {
    ipcRenderer.on("debug", console.log)
  }, [])

  const getAttack = () => {
    if (attackMode === "rainbow watermarks") {
        return (<><RainbowOptions/><RainbowImage/></>)
    } else if (attackMode === "pointifiction") {
        return (<PointImage/>)
    } else if (attackMode === "pixel shift") {
      return (<PixelShiftImage/>)
  }
  }

  return (
    <main className="app">
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
    </main>
  )
}

ReactDom.render(<App/>, document.getElementById("root"))
