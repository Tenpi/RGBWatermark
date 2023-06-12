// @ts-nocheck
import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {EnableDragContext, MobileContext, ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, patterns} from "../Context"
import functions from "../structures/Functions"
import {Dropdown, DropdownButton} from "react-bootstrap"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import JSZip from "jszip"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import "./styles/pointimage.less"

let gifPos = 0

const RGBSplit: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const [rgbSplitHue, setRGBSplitHue] = useState(-94)
    const [rgbSplitSaturation, setRGBSplitSaturation] = useState(100)
    const [rgbSplitBrightness, setRGBSplitBrightness] = useState(100)
    const [rgbSplitSize, setRGBSplitSize] = useState(6)
    const [rgbSplitAngle, setRGBSplitAngle] = useState(1)
    const [rgbSplitVariance, setRGBSplitVariance] = useState(1)
    const [rgbSplitOpacity, setRGBSplitOpacity] = useState(100)
    const [rgbSplitBlendMode, setRGBSplitBlendMode] = useState("multiply")
    const [rgbSplitChannels, setRGBSplitChannels] = useState({r: true, g: true, b: false})
    const [gifData, setGIFData] = useState(null) as any
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [seed, setSeed] = useState(0)
    const ref = useRef<HTMLCanvasElement>(null)
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
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                if (jpg || png || gif || webp) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setImage(link)
                    setImageName(file.name.slice(0, 30))
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const removeImage = () => {
        setImage("")
        setImageName("")
    }

    const checkOverlap = (rect1: any, rect2: any) => {
        return (
          rect1.x < rect2.x + rect2.width &&
          rect1.x + rect1.width > rect2.x &&
          rect1.y < rect2.y + rect2.height &&
          rect1.y + rect1.height > rect2.y
        )
    }

    const getOutputDimensions = () => {
        if (!img) return {width: 0, height: 0}
        let destSize = outputSize
        if (Number.isNaN(destSize)) destSize = 100
        const width = Math.floor((destSize / 100) * img.width)
        const height = Math.floor((destSize / 100) * img.height)
        return {width, height}
    }

    const draw = (gifPos: number, renderWidth?: boolean) => {
        if (!ref.current || !img) return ""
        const refCtx = ref.current.getContext("2d")!
        refCtx.clearRect(0, 0, ref.current.width, ref.current.height)
        if (renderWidth) {
            const dimensions = getOutputDimensions()
            ref.current.width = dimensions.width
            ref.current.height = dimensions.height
        } else {
            let greaterValue = img.width > img.height ? img.width : img.height
            const ratio = greaterValue / 1000
            ref.current.width = Math.floor(img.width / ratio)
            ref.current.height = Math.floor(img.height / ratio)
        }
        refCtx.save()
        if (gifData) {
            const frame = gifData[gifPos].frame
            let delay = gifData[gifPos].delay
            if (delay < 0) delay = 0
            refCtx?.drawImage(frame, 0, 0, img.width, img.height, 0, 0, ref.current.width, ref.current.height)
        } else {
            refCtx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, ref.current.width, ref.current.height)
        }
        refCtx.restore()
    }
    const applyRGBSplit = (outputType?: string) => {
    }

    const loadImg = () => {
        if (!image) return setImg(null)
        const imgElement = document.createElement("img")
        imgElement.src = image
        imgElement.onload = () => {
            if (!ref.current) return
            ref.current.width = imgElement.width
            ref.current.height = imgElement.height
            setImg(imgElement)
        }
    }

    const parseGIF = async () => {
        const frames = await functions.extractGIFFrames(image)
        setGIFData(frames)
    }

    const parseAnimatedWebP = async () => {
        const arraybuffer = await fetch(image).then((r) => r.arrayBuffer())
        const animated = await functions.isAnimatedWebp(arraybuffer)
        if (!animated) return 
        const frames = await functions.extractAnimatedWebpFrames(image)
        setGIFData(frames)
    }

    useEffect(() => {
        setGIFData(null)
        loadImg()
        if (functions.isGIF(image)) parseGIF()
        if (functions.isWebP(image)) parseAnimatedWebP()
    }, [image])

    useEffect(() => {
        let timeout = null as any
        const animationLoop = async () => {
            draw(gifPos)
            applyRGBSplit()
            if (gifData) {
                if (reverse) {
                    gifPos--
                } else {
                    gifPos++
                }
                if (gifPos > gifData.length - 1) gifPos = 0
                if (gifPos < 0) gifPos = gifData.length - 1
            }
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                let delay = gifData ? gifData[gifPos].delay / 2 : 10000
                timeout = setTimeout(() => {
                    resolve()
                }, delay)
            }).then(animationLoop)
        }
        animationLoop()
        return () => {
            clearTimeout(timeout)
        }
    }, [img, rgbSplitAngle, rgbSplitBrightness, rgbSplitHue, rgbSplitSaturation, rgbSplitSize, rgbSplitVariance, rgbSplitChannels, rgbSplitBlendMode, rgbSplitOpacity, gifData])

    const jpg = async () => {
        draw(0, true)
        const img = applyRGBSplit("image/jpeg") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbsplit.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = applyRGBSplit("image/png") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbsplit.png`, img)
    }

    const zip = async () => {
        if (!gifData) return
        const zip = new JSZip()
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const img = applyRGBSplit("image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_rgbsplit ${i + 1}.png`, data, {binary: true})
            }
        } else {
            draw(0, true)
            const img = applyRGBSplit("image/png") as string
            const data = await fetch(img).then((r) => r.arrayBuffer())
            zip.file(`${path.basename(imageName, path.extname(imageName))}_rgbsplit 1.png`, data, {binary: true})
        }
        const filename = `${path.basename(imageName, path.extname(imageName))}_rgbsplit.zip`
        const blob = await zip.generateAsync({type: "blob"})
        const url = window.URL.createObjectURL(blob)
        functions.download(filename, url)
        window.URL.revokeObjectURL(url)
    }

    const gif = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applyRGBSplit("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyRGBSplit("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const dimensions = getOutputDimensions()
        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbsplit.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    const mp4 = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applyRGBSplit("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyRGBSplit("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const url = await functions.encodeVideo(frames, functions.msToFps(delays[0]))
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbsplit.mp4`, url)
        window.URL.revokeObjectURL(url)
    }

    const reset = () => {
        setRGBSplitSize(6)
        setRGBSplitHue(-180)
        setRGBSplitSaturation(100)
        setRGBSplitBrightness(100)
        setRGBSplitAngle(0)
        setRGBSplitVariance(0)
        setRGBSplitChannels({r: true, g: true, b: false})
        setRGBSplitOpacity(100)
        setRGBSplitBlendMode("multiply")
    }

    useEffect(() => {
        const savedRGBSplitSize = localStorage.getItem("rgbSplitSize")
        if (savedRGBSplitSize) setRGBSplitSize(Number(savedRGBSplitSize))
        const savedRGBSplitHue = localStorage.getItem("rgbSplitHue")
        if (savedRGBSplitHue) setRGBSplitHue(Number(savedRGBSplitHue))
        const savedRGBSplitSaturation = localStorage.getItem("rgbSplitSaturation")
        if (savedRGBSplitSaturation) setRGBSplitSaturation(Number(savedRGBSplitSaturation))
        const savedRGBSplitBrightness = localStorage.getItem("rgbSplitBrightness")
        if (savedRGBSplitBrightness) setRGBSplitBrightness(Number(savedRGBSplitBrightness))
        const savedRGBSplitAngle = localStorage.getItem("rgbSplitAngle")
        if (savedRGBSplitAngle) setRGBSplitAngle(Number(savedRGBSplitAngle))
        const savedRGBSplitVariance = localStorage.getItem("rgbSplitVariance")
        if (savedRGBSplitVariance) setRGBSplitVariance(Number(savedRGBSplitVariance))
        const savedRGBSplitChannels = localStorage.getItem("rgbSplitChannels")
        if (savedRGBSplitChannels) setRGBSplitChannels(JSON.parse(savedRGBSplitChannels))
        const savedRGBSplitOpacity = localStorage.getItem("rgbSplitOpacity")
        if (savedRGBSplitOpacity) setRGBSplitOpacity(Number(savedRGBSplitOpacity))
        const savedRGBSplitBlendMode = localStorage.getItem("rgbSplitBlendMode")
        if (savedRGBSplitBlendMode) setRGBSplitBlendMode(savedRGBSplitBlendMode)
    }, [])

    useEffect(() => {
        localStorage.setItem("rgbSplitSize", String(rgbSplitSize))
        localStorage.setItem("rgbSplitHue", String(rgbSplitHue))
        localStorage.setItem("rgbSplitSaturation", String(rgbSplitSaturation))
        localStorage.setItem("rgbSplitBrightness", String(rgbSplitBrightness))
        localStorage.setItem("rgbSplitAngle", String(rgbSplitAngle))
        localStorage.setItem("rgbSplitVariance", String(rgbSplitVariance))
        localStorage.setItem("rgbSplitChannels", JSON.stringify(rgbSplitChannels))
        localStorage.setItem("rgbSplitOpacity", String(rgbSplitOpacity))
        localStorage.setItem("rgbSplitBlendMode", String(rgbSplitBlendMode))
    }, [rgbSplitSize, rgbSplitHue, rgbSplitSaturation, rgbSplitBrightness, rgbSplitAngle, rgbSplitVariance, rgbSplitChannels, rgbSplitOpacity, rgbSplitBlendMode])

    const getColorArray = () => {
        const arr = [] as string[]
        if (rgbSplitChannels.r) arr.push("r")
        if (rgbSplitChannels.g) arr.push("g")
        if (rgbSplitChannels.b) arr.push("b")
        return arr
    }

    const appendColorChannel = (channel: string) => {
        const channels = JSON.parse(JSON.stringify(rgbSplitChannels))
        if (channel === "r") {
            channels.r = !channels.r
        } else if (channel === "g") {
            channels.g = !channels.g
        } else if (channel === "b") {
            channels.b = !channels.b
        }
        setRGBSplitChannels(channels)
    }

    const getBlendMode = () => {
        if (rgbSplitBlendMode === "source-over") return "Normal"
        if (rgbSplitBlendMode === "color-dodge") return "Color Dodge"
        if (rgbSplitBlendMode === "color-burn") return "Color Burn"
        if (rgbSplitBlendMode === "hard-light") return "Hard Light"
        if (rgbSplitBlendMode === "soft-light") return "Soft Light"
        return functions.toProperCase(rgbSplitBlendMode)
    }

    return (
        <div className="point-image-component" onMouseEnter={() => setEnableDrag(true)}>
            <div className="point-upload-container">
                <div className="point-row">
                    <span className="point-text">Image:</span>
                </div>
                <div className="point-row">
                    <label htmlFor="img" className="point-button" style={{width: "119px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" onChange={(event) => loadImage(event)}/>
                    {image ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} style={{filter: getFilter()}} onClick={removeImage}/>
                            <span className="button-image-name">{imageName}</span>
                        </div>
                    : null}
                </div>
            </div>
            {image ?
            <div className="point-image-container">
                <canvas className="point-image" ref={ref}></canvas>
            </div> : null}
            <div className="point-options-container">
                <div className="point-row">
                    <span className="point-text-mini" style={{width: "auto", fontSize: "20px"}}>R</span>
                    <img className="point-checkbox" src={rgbSplitChannels.r ? checkboxChecked : checkbox} onClick={() => appendColorChannel("r")} style={{marginLeft: "5px", filter: getFilter()}}/>
                    <span className="point-text-mini" style={{width: "auto", fontSize: "20px"}}>G</span>
                    <img className="point-checkbox" src={rgbSplitChannels.g ? checkboxChecked : checkbox} onClick={() => appendColorChannel("g")} style={{marginLeft: "5px", filter: getFilter()}}/>
                    <span className="point-text-mini" style={{width: "auto", fontSize: "20px"}}>B</span>
                    <img className="point-checkbox" src={rgbSplitChannels.b ? checkboxChecked : checkbox} onClick={() => appendColorChannel("b")} style={{marginLeft: "5px", filter: getFilter()}}/>
                </div>
                <div className="point-row">
                    <span className="options-text">Blend Mode:</span>
                    <DropdownButton title={getBlendMode()} drop="down">
                        <Dropdown.Item active={rgbSplitBlendMode === "source-over"} onClick={() => setRGBSplitBlendMode("source-over")}>Normal</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "multiply"} onClick={() => setRGBSplitBlendMode("multiply")}>Multiply</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "screen"} onClick={() => setRGBSplitBlendMode("screen")}>Screen</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "overlay"} onClick={() => setRGBSplitBlendMode("overlay")}>Overlay</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "darken"} onClick={() => setRGBSplitBlendMode("darken")}>Darken</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "lighten"} onClick={() => setRGBSplitBlendMode("lighten")}>Lighten</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "color-dodge"} onClick={() => setRGBSplitBlendMode("color-dodge")}>Color Dodge</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "color-burn"} onClick={() => setRGBSplitBlendMode("color-burn")}>Color Burn</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "hard-light"} onClick={() => setRGBSplitBlendMode("hard-light")}>Hard Light</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "soft-light"} onClick={() => setRGBSplitBlendMode("soft-light")}>Soft Light</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "hue"} onClick={() => setRGBSplitBlendMode("hue")}>Hue</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "saturation"} onClick={() => setRGBSplitBlendMode("saturation")}>Saturation</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "color"} onClick={() => setRGBSplitBlendMode("color")}>Color</Dropdown.Item>
                        <Dropdown.Item active={rgbSplitBlendMode === "luminosity"} onClick={() => setRGBSplitBlendMode("luminosity")}>Luminosity</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="point-row">
                    <span className="point-text">Opacity: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitOpacity(value)} min={0} max={100} step={1} value={rgbSplitOpacity}/>
                    <span className="point-text-mini">{rgbSplitOpacity}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Hue: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitHue(value)} min={-180} max={180} step={1} value={rgbSplitHue}/>
                    <span className="point-text-mini">{rgbSplitHue}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Saturation: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitSaturation(value)} min={0} max={200} step={1} value={rgbSplitSaturation}/>
                    <span className="point-text-mini">{rgbSplitSaturation}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Brightness: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitBrightness(value)} min={0} max={200} step={1} value={rgbSplitBrightness}/>
                    <span className="point-text-mini">{rgbSplitBrightness}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Angle: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitAngle(value)} min={-45} max={45} step={1} value={rgbSplitAngle}/>
                    <span className="point-text-mini">{rgbSplitAngle}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Size: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitSize(value)} min={1} max={50} step={1} value={rgbSplitSize}/>
                    <span className="point-text-mini">{rgbSplitSize}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Variance: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setRGBSplitVariance(value)} min={0} max={25} step={1} value={rgbSplitVariance}/>
                    <span className="point-text-mini">{rgbSplitVariance}</span>
                </div>
            </div>
            {image ?
            <div className="point-image-container">
                <div className="point-image-buttons-container">
                    <button className="point-image-button" onClick={jpg}>JPG</button>
                    <button className="point-image-button" onClick={png}>PNG</button>
                    <button className="point-image-button" onClick={zip}>ZIP</button>
                    <button className="point-image-button" onClick={gif}>GIF</button>
                    <button className="point-image-button" onClick={mp4}>MP4</button>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">Output Size:</span>
                    <input className="point-image-output-input" type="text" spellCheck="false" value={outputSize} onChange={(event) => setOutputSize(event.target.value)} onMouseOver={() => setEnableDrag(false)}/>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">{getOutputDimensions().width}x{getOutputDimensions().height}</span>
                </div>
            </div> : null}
            <div className="point-options-container">
                <div className="point-row">
                    <button className="point-button" onClick={reset} style={{padding: "0px 5px", marginTop: "7px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RGBSplit