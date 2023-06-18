import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ImageContext, WatermarkImageContext, TextContext, FontContext, BlendModeContext, defaultColorStops, BrightnessContext,
OpacityContext, SizeContext, MarginContext, AngleContext, SpeedContext, ImageNameContext, ColorStopContext, ReverseContext, SaturationContext, ImbalanceContext,
StopAnimationContext, PixelateContext, TypeContext, VarianceContext, PatternContext, OutputSizeContext, RotationSpeedContext, HighCoverageContext, HueContext, PosXContext, PosYContext, patterns} from "../renderer"
import functions from "../structures/Functions"
import {Dropdown, DropdownButton} from "react-bootstrap"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import addIcon from "../assets/icons/add.png"
import xIcon from "../assets/icons/x.png"
import ColorStopEdit from "./ColorStopEdit"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import path from "path"
import "./styles/rainbowoptions.less"

const Options: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {watermarkImage, setWatermarkImage} = useContext(WatermarkImageContext)
    const {text, setText} = useContext(TextContext)
    const {font, setFont} = useContext(FontContext)
    const {blendMode, setBlendMode} = useContext(BlendModeContext)
    const {opacity, setOpacity} = useContext(OpacityContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {size, setSize} = useContext(SizeContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const {margin, setMargin} = useContext(MarginContext)
    const {angle, setAngle} = useContext(AngleContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {colorStops, setColorStops} = useContext(ColorStopContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {variance, setVariance} = useContext(VarianceContext)
    const {pattern, setPattern} = useContext(PatternContext)
    const {type, setType} = useContext(TypeContext)
    const {stopAnimations, setStopAnimations} = useContext(StopAnimationContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {rotationSpeed, setRotationSpeed} = useContext(RotationSpeedContext)
    const {highCoverage, setHighCoverage} = useContext(HighCoverageContext)
    const {imbalance, setImbalance} = useContext(ImbalanceContext)
    const {hue, setHue} = useContext(HueContext)
    const {posX, setPosX} = useContext(PosXContext)
    const {posY, setPosY} = useContext(PosYContext)
    const [customFont, setCustomFont] = useState("")
    const history = useHistory()

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const loadImage = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg" 
                || path.extname(file.name) === ".jpg"
                || path.extname(file.name) === ".jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                if (jpg || png || gif || webp) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setImage(link)
                    setImageName(file.name)
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const loadFont = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const ttf = file.name.endsWith("ttf")
                const otf = file.name.endsWith("otf")
                const woff = file.name.endsWith("woff")
                const woff2 = file.name.endsWith("woff2")
                if (ttf || otf || woff || woff2) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const font = new FontFace("custom", `url(${url})`)
                    const loaded = await font.load()
                    // @ts-ignore
                    document.fonts.add(loaded)
                    setCustomFont(path.basename(file.name, path.extname(file.name)))
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    useEffect(() => {
        if (font !== "custom") setCustomFont("")
    }, [font])

    const removeImage = () => {
        setImage("")
        setImageName("")
    }

    const loadWatermarkImage = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg" 
                || path.extname(file.name) === ".jpg"
                || path.extname(file.name) === ".jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                if (jpg || png || gif || webp) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setWatermarkImage(link)
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const removeWatermarkImage = () => {
        setWatermarkImage("")
    }

    const getBlendMode = () => {
        if (blendMode === "source-over") return "Normal"
        if (blendMode === "color-dodge") return "Color Dodge"
        if (blendMode === "color-burn") return "Color Burn"
        if (blendMode === "hard-light") return "Hard Light"
        if (blendMode === "soft-light") return "Soft Light"
        return functions.toProperCase(blendMode)
    }

    const getFont = () => {
        if (font === "comic sans ms") return "Comic Sans MS"
        if (font === "roughedges") return "Rough Edges"
        if (font === "candystripe") return "Candy Stripe"
        if (font === "cardewthree") return "Cardew Three"
        return functions.toProperCase(font)
    }

    const addColorStop = () => {
        let newColorStops = [] as any
        let k = 0
        let totalK = colorStops.length + 1
        if (totalK > 23) return
        for (let i = 0; i < colorStops.length; i++) {
            newColorStops.push({position: k/totalK, color: colorStops[i].color})
            k++
        }
        newColorStops.push({position: k/totalK, color: colorStops[colorStops.length - 1].color})
        setColorStops(newColorStops)
    }

    useEffect(() => {
        const savedText = localStorage.getItem("text")
        if (savedText) setText(savedText)
        const savedFont = localStorage.getItem("font")
        if (savedFont) setFont(savedFont)
        const savedBlendMode = localStorage.getItem("blendMode")
        if (savedBlendMode) setBlendMode(savedBlendMode)
        let savedType = localStorage.getItem("type")
        if (savedType) {
            if (savedType === "image") savedType = "text"
            setType(savedType)
        }
        const savedPattern = localStorage.getItem("pattern")
        if (savedPattern) setPattern(savedPattern)
        const savedOpacity = localStorage.getItem("opacity")
        if (savedOpacity) setOpacity(Number(savedOpacity))
        const savedSize = localStorage.getItem("size")
        if (savedSize) setSize(Number(savedSize))
        const savedAngle = localStorage.getItem("angle")
        if (savedAngle) setAngle(Number(savedAngle))
        const savedSpeed = localStorage.getItem("speed")
        if (savedSpeed) setSpeed(Number(savedSpeed))
        const savedPixelate = localStorage.getItem("pixelate")
        if (savedPixelate) setPixelate(Number(savedPixelate))
        const savedHue = localStorage.getItem("hue")
        if (savedHue) setHue(Number(savedHue))
        const savedBrightness = localStorage.getItem("brightness")
        if (savedBrightness) setBrightness(Number(savedBrightness))
        const savedSaturation = localStorage.getItem("saturation")
        if (savedSaturation) setSaturation(Number(savedSaturation))
        const savedOutputSize = localStorage.getItem("outputSize")
        if (savedOutputSize) setOutputSize(Number(savedOutputSize))
        const savedVariance = localStorage.getItem("variance")
        if (savedVariance) setVariance(Number(savedVariance))
        const savedImbalance = localStorage.getItem("imbalance")
        if (savedImbalance) setImbalance(Number(savedImbalance))
        const savedRotationSpeed = localStorage.getItem("rotationSpeed")
        if (savedRotationSpeed) setRotationSpeed(Number(savedRotationSpeed))
        const savedPosX = localStorage.getItem("posX")
        if (savedPosX) setPosX(Number(savedPosX))
        const savedPosY = localStorage.getItem("posY")
        if (savedPosY) setPosY(Number(savedPosY))
        const savedReverse = localStorage.getItem("reverse")
        if (savedReverse) setReverse(savedReverse === "true")
        const savedHighCoverage = localStorage.getItem("highCoverage")
        if (savedHighCoverage) setHighCoverage(savedHighCoverage === "true")
        const savedStopAnimations = localStorage.getItem("stopAnimations")
        if (savedStopAnimations) setStopAnimations(savedStopAnimations === "true")
        const savedColorStops = localStorage.getItem("colorStops")
        if (savedColorStops) setColorStops(JSON.parse(savedColorStops))
    }, [])

    useEffect(() => {
        localStorage.setItem("text", text)
        localStorage.setItem("font", font)
        localStorage.setItem("blendMode", blendMode)
        localStorage.setItem("opacity", opacity)
        localStorage.setItem("size", size)
        localStorage.setItem("angle", angle)
        localStorage.setItem("speed", speed)
        localStorage.setItem("reverse", reverse)
        localStorage.setItem("type", type)
        localStorage.setItem("pattern", pattern)
        localStorage.setItem("saturation", saturation)
        localStorage.setItem("brightness", brightness)
        localStorage.setItem("pixelate", pixelate)
        localStorage.setItem("stopAnimations", stopAnimations)
        localStorage.setItem("outputSize", outputSize)
        localStorage.setItem("rotationSpeed", rotationSpeed)
        localStorage.setItem("variance", variance)
        localStorage.setItem("imbalance", imbalance)
        localStorage.setItem("highCoverage", highCoverage)
        localStorage.setItem("hue", hue)
        localStorage.setItem("posX", posX)
        localStorage.setItem("posY", posY)
        localStorage.setItem("colorStops", JSON.stringify(colorStops))
    }, [text, font, blendMode, opacity, size, angle, margin, speed, reverse, colorStops, saturation, brightness, pixelate, type, outputSize, pattern, rotationSpeed, variance, imbalance, hue, posX, posY, highCoverage, stopAnimations])

    const reset = () => {
        setType("text")
        setPattern("square")
        setText("Sample")
        setFont("dotline")
        setBlendMode("source-over")
        setOpacity(0.5)
        setPixelate(1)
        setSize(20)
        setAngle(45)
        setMargin(25)
        setSpeed(75)
        setReverse(false)
        setSaturation(100)
        setBrightness(100)
        setColorStops(defaultColorStops)
        setOutputSize(100)
        setWatermarkImage("")
        setRotationSpeed(1)
        setVariance(0)
        setImbalance(0)
        setHighCoverage(false)
        setHue(0)
        setPosX(0)
        setPosY(0)
    }

    const generatePatternJSX = () => {
        let jsx = [] as any 
        const step = 3
        const increment = Math.ceil((patterns ? patterns.length : 1) / step)
        for (let i = 0; i < increment; i++) {
            let midJSX = [] as any
            for (let j = 0; j < step; j++) {
                const k = (i*step)+j
                if (!patterns[k]) break
                midJSX.push(<img className={pattern === patterns[k].name ? "pattern-img-selected" : "pattern-img"} src={patterns[k].image} onClick={() => setPattern(patterns[k].name)}/>)
            }
            jsx.push(<div className="pattern-row">{midJSX}</div>)
        }
        return jsx
    }

    return (
        <div className="options">
            <div className="options-container">
                <div className="options-row">
                    <span className="options-text">Image:</span>
                </div>
                <div className="options-row">
                    <label htmlFor="img" className="options-button" style={{width: "92px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" onChange={(event) => loadImage(event)}/>
                    {image ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} onClick={removeImage}/>
                            <span className="button-image-name">{imageName}</span>
                        </div>
                    : null}
                </div>
                <div className="options-row">
                    <span className="options-text">Type:</span>
                </div>
                <div className="options-row">
                    <button className="options-button" onClick={() => {setType("text"); removeWatermarkImage()}}>
                        <span className="button-hover">
                            <span className={`button-text ${type === "text" ? "button-text-selected" : ""}`}>Text</span>
                        </span>
                    </button>
                    <label htmlFor="watermark-img" className="options-button" style={{marginLeft: "10px", marginTop: "6px"}}>
                        <span className="button-hover">
                            <span className={`button-text ${type === "image" ? "button-text-selected" : ""}`}>Image</span>
                        </span>
                    </label>
                    <input id="watermark-img" type="file" onChange={(event) => {setType("image"); loadWatermarkImage(event)}}/>
                    <button className="options-button" onClick={() => {setType("pattern"); removeWatermarkImage()}} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`button-text ${type === "pattern" ? "button-text-selected" : ""}`}>Particle</span>
                        </span>
                    </button>
                    {type === "text" ? 
                    <div className="options-text-container" style={{marginLeft: "10px"}}>
                        <input className="options-text-input" type="text" spellCheck="false" value={text} onChange={(event) => setText(event.target.value)}/>
                    </div> :
                    type === "image" ? 
                    <div className="options-watermark-container">
                        <img className="options-watermark-image" src={watermarkImage}/>
                    </div> : 
                    null}
                </div>
                {type === "pattern" ? <>
                <div className="options-column">
                    {generatePatternJSX()}
                </div>
                <div className="options-row">
                    <span className="options-text">Rotation Speed: </span>
                    <span className="options-text-mini">{Math.floor(rotationSpeed)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setRotationSpeed(value)} min={1} max={50} step={1} value={rotationSpeed}/>
                </div>
                <div className="options-row">
                    <span className="options-text">High Coverage?</span>
                    <img className="options-checkbox" src={highCoverage ? checkboxChecked : checkbox} onClick={() => setHighCoverage((prev: boolean) => !prev)}/>
                </div></>
                : null}
                <div className="options-row">
                    <span className="options-text">Font:</span>
                    <DropdownButton title={getFont()} drop="down">
                        <Dropdown.Item active={font === "candystripe"} onClick={() => setFont("candystripe")}>Candy Stripe</Dropdown.Item>
                        <Dropdown.Item active={font === "cardewthree"} onClick={() => setFont("cardewthree")}>Cardew Three</Dropdown.Item>
                        <Dropdown.Item active={font === "dotline"} onClick={() => setFont("dotline")}>Dotline</Dropdown.Item>
                        <Dropdown.Item active={font === "dotness"} onClick={() => setFont("dotness")}>Dotness</Dropdown.Item>
                        <Dropdown.Item active={font === "organique"} onClick={() => setFont("organique")}>Organique</Dropdown.Item>
                        <Dropdown.Item active={font === "pixelated"} onClick={() => setFont("pixelated")}>Pixelated</Dropdown.Item>
                        <Dropdown.Item active={font === "roughedges"} onClick={() => setFont("roughedges")}>Rough Edges</Dropdown.Item>
                        <Dropdown.Item active={font === "zerpixl"} onClick={() => setFont("zerpixl")}>Zerpixl</Dropdown.Item>
                        <Dropdown.Item active={font === "arial"} onClick={() => setFont("arial")}>Arial</Dropdown.Item>
                        <Dropdown.Item active={font === "impact"} onClick={() => setFont("impact")}>Impact</Dropdown.Item>
                        <Dropdown.Item active={font === "courier"} onClick={() => setFont("courier")}>Courier</Dropdown.Item>
                        <Dropdown.Item active={font === "rockwell"} onClick={() => setFont("rockwell")}>Rockwell</Dropdown.Item>
                        <Dropdown.Item active={font === "comic sans ms"} onClick={() => setFont("comic sans ms")}>Comic Sans MS</Dropdown.Item>
                        <Dropdown.Item active={font === "custom"} onClick={() => setFont("custom")}>Custom</Dropdown.Item>
                    </DropdownButton>
                    <span className="options-text">Blend Mode:</span>
                    <DropdownButton title={getBlendMode()} drop="down">
                        <Dropdown.Item active={blendMode === "source-over"} onClick={() => setBlendMode("source-over")}>Normal</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "multiply"} onClick={() => setBlendMode("multiply")}>Multiply</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "screen"} onClick={() => setBlendMode("screen")}>Screen</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "overlay"} onClick={() => setBlendMode("overlay")}>Overlay</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "darken"} onClick={() => setBlendMode("darken")}>Darken</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "lighten"} onClick={() => setBlendMode("lighten")}>Lighten</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "color-dodge"} onClick={() => setBlendMode("color-dodge")}>Color Dodge</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "color-burn"} onClick={() => setBlendMode("color-burn")}>Color Burn</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "hard-light"} onClick={() => setBlendMode("hard-light")}>Hard Light</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "soft-light"} onClick={() => setBlendMode("soft-light")}>Soft Light</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "hue"} onClick={() => setBlendMode("hue")}>Hue</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "saturation"} onClick={() => setBlendMode("saturation")}>Saturation</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "color"} onClick={() => setBlendMode("color")}>Color</Dropdown.Item>
                        <Dropdown.Item active={blendMode === "luminosity"} onClick={() => setBlendMode("luminosity")}>Luminosity</Dropdown.Item>
                    </DropdownButton>
                </div>
                {font === "custom" ? 
                <div className="options-row">
                <span className="options-text">Custom Font: </span>
                    <label htmlFor="custom-font" className="options-button-2" style={{marginLeft: "10px", marginTop: "5px"}}>
                        <span className="button-hover">
                            <span className="button-text" style={{fontSize: "15px"}}>Upload</span>
                        </span>
                    </label>
                    <input id="custom-font" type="file" onChange={(event) => loadFont(event)}/>
                    {customFont ? 
                        <div className="button-image-name-container">
                            <span className="button-image-name">{customFont}</span>
                        </div>
                    : null}
                </div>
                : null}
                <div className="options-row">
                    <span className="options-text">Opacity: </span>
                    <span className="options-text-mini">{Math.floor(opacity * 100)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setOpacity(value)} min={0} max={1} step={0.01} value={opacity}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Hue: </span>
                    <span className="options-text-mini">{Math.floor(hue)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setHue(value)} min={-90} max={90} step={1} value={hue}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Saturation: </span>
                    <span className="options-text-mini">{Math.floor(saturation)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setSaturation(value)} min={25} max={150} step={1} value={saturation}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Brightness: </span>
                    <span className="options-text-mini">{Math.floor(brightness)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setBrightness(value)} min={50} max={200} step={1} value={brightness}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Size: </span>
                    <span className="options-text-mini">{Math.floor(size)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setSize(value)} min={3} max={50} step={1} value={size}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Angle: </span>
                    <span className="options-text-mini">{Math.floor(angle)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setAngle(value)} min={-90} max={90} step={1} value={angle}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Margin: </span>
                    <span className="options-text-mini">{Math.floor(margin)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setMargin(value)} min={10} max={200} step={1} value={margin}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Variance: </span>
                    <span className="options-text-mini">{Math.floor(variance)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setVariance(value)} min={0} max={100} step={1} value={variance}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Imbalance: </span>
                    <span className="options-text-mini">{Math.floor(imbalance)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setImbalance(value)} min={0} max={30} step={1} value={imbalance}/>
                </div>
                <div className="options-row">
                    <span className="options-text">Speed: </span>
                    <span className="options-text-mini">{Math.floor(speed)}</span>
                    <Slider className="options-slider" trackClassName="options-slider-track" thumbClassName="options-slider-thumb" onChange={(value) => setSpeed(value)} min={30} max={200} step={1} value={speed}/>
                </div>
                <div className="options-column">
                    <div className="options-row">
                        <span className="options-text">Color Stops: </span>
                        <img className="colorstop-add" src={addIcon} onClick={addColorStop}/>
                    </div>
                    <ColorStopEdit/>
                </div>
                <div className="options-row">
                    <button className="options-button" onClick={reset} style={{padding: "0px 5px", marginTop: "7px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                    <button className="options-button" style={{padding: "0px 5px", marginLeft: "10px", marginTop: "7px", backgroundColor: stopAnimations ? "var(--buttonBG)" : "var(--buttonBG2)"}} onClick={() => setStopAnimations((prev: boolean) => !prev)}>
                        <span className="button-hover">
                            <span className="button-text">{stopAnimations ? "Start Animations" : "Stop Animations"}</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Options