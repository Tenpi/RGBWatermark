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
// import noise1 from "../assets/icons/noise/noise1.jpg"

const noise1 = "https://github.com/Tenpi/RGBWatermark.net/blob/main/assets/icons/noise/noise1.jpg?raw=true"

let gifPos = 0

const AdversarialNoise: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [advNoiseImg, setAdvNoiseImg] = useState(null as HTMLImageElement | null)
    const [advNoiseOpacity, setAdvNoiseOpacity] = useState(100)
    const [advNoiseBlendMode, setAdvNoiseBlendMode] = useState("darken")
    const [advNoiseScale, setAdvNoiseScale] = useState(1)
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

    const applyAdversarialNoise = (outputType?: string) => {
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

    const loadAdvNoiseImg = () => {
        const imgElement = document.createElement("img")
        imgElement.src = noise1
        imgElement.onload = () => {
            setAdvNoiseImg(imgElement)
        }
    }

    useEffect(() => {
        loadAdvNoiseImg()
    }, [seed])

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
            applyAdversarialNoise()
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
    }, [img, advNoiseImg, advNoiseBlendMode, advNoiseOpacity, advNoiseScale, gifData, seed])

    const jpg = async () => {
        draw(0, true)
        const img = applyAdversarialNoise("image/jpeg") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_adversarialnoise.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = applyAdversarialNoise("image/png") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_adversarialnoise.png`, img)
    }

    const zip = async () => {
        if (!gifData) return
        const zip = new JSZip()
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const img = applyAdversarialNoise("image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_adversarialnoise ${i + 1}.png`, data, {binary: true})
            }
        } else {
            draw(0, true)
            const img = applyAdversarialNoise("image/png") as string
            const data = await fetch(img).then((r) => r.arrayBuffer())
            zip.file(`${path.basename(imageName, path.extname(imageName))}_adversarialnoise 1.png`, data, {binary: true})
        }
        const filename = `${path.basename(imageName, path.extname(imageName))}_adversarialnoise.zip`
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
                const frame = applyAdversarialNoise("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyAdversarialNoise("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const dimensions = getOutputDimensions()
        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}_adversarialnoise.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    const mp4 = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applyAdversarialNoise("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyAdversarialNoise("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const url = await functions.encodeVideo(frames, functions.msToFps(delays[0]))
        functions.download(`${path.basename(imageName, path.extname(imageName))}_adversarialnoise.mp4`, url)
        window.URL.revokeObjectURL(url)
    }

    const reset = () => {
        setAdvNoiseBlendMode("darken")
        setAdvNoiseOpacity(100)
        setAdvNoiseScale(1)
    }

    useEffect(() => {
        const savedAdvNoiseBlendMode = localStorage.getItem("advNoiseBlendMode")
        if (savedAdvNoiseBlendMode) setAdvNoiseBlendMode(savedAdvNoiseBlendMode)
        const savedAdvNoiseOpacity = localStorage.getItem("advNoiseOpacity")
        if (savedAdvNoiseOpacity) setAdvNoiseOpacity(Number(savedAdvNoiseOpacity))
        const savedAdvNoiseScale = localStorage.getItem("advNoiseScale")
        if (savedAdvNoiseScale) setAdvNoiseScale(Number(savedAdvNoiseScale))
    }, [])

    useEffect(() => {
        localStorage.setItem("advNoiseBlendMode", advNoiseBlendMode)
        localStorage.setItem("advNoiseOpacity", String(advNoiseOpacity))
        localStorage.setItem("advNoiseScale", String(advNoiseScale))
    }, [advNoiseBlendMode, advNoiseOpacity, advNoiseScale])

    const getBlendMode = () => {
        if (advNoiseBlendMode === "source-over") return "Normal"
        if (advNoiseBlendMode === "color-dodge") return "Color Dodge"
        if (advNoiseBlendMode === "color-burn") return "Color Burn"
        if (advNoiseBlendMode === "hard-light") return "Hard Light"
        if (advNoiseBlendMode === "soft-light") return "Soft Light"
        return functions.toProperCase(advNoiseBlendMode)
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
                    <button className="point-button-small" onClick={() => setSeed(Math.floor(Math.random() * 1000))} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small`}>Change Seed</span>
                        </span>
                    </button>
                </div>
                <div className="point-row">
                    <span className="options-text">Blend Mode:</span>
                    <DropdownButton title={getBlendMode()} drop="down">
                        <Dropdown.Item active={advNoiseBlendMode === "source-over"} onClick={() => setAdvNoiseBlendMode("source-over")}>Normal</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "multiply"} onClick={() => setAdvNoiseBlendMode("multiply")}>Multiply</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "screen"} onClick={() => setAdvNoiseBlendMode("screen")}>Screen</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "overlay"} onClick={() => setAdvNoiseBlendMode("overlay")}>Overlay</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "darken"} onClick={() => setAdvNoiseBlendMode("darken")}>Darken</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "lighten"} onClick={() => setAdvNoiseBlendMode("lighten")}>Lighten</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "color-dodge"} onClick={() => setAdvNoiseBlendMode("color-dodge")}>Color Dodge</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "color-burn"} onClick={() => setAdvNoiseBlendMode("color-burn")}>Color Burn</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "hard-light"} onClick={() => setAdvNoiseBlendMode("hard-light")}>Hard Light</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "soft-light"} onClick={() => setAdvNoiseBlendMode("soft-light")}>Soft Light</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "hue"} onClick={() => setAdvNoiseBlendMode("hue")}>Hue</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "saturation"} onClick={() => setAdvNoiseBlendMode("saturation")}>Saturation</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "color"} onClick={() => setAdvNoiseBlendMode("color")}>Color</Dropdown.Item>
                        <Dropdown.Item active={advNoiseBlendMode === "luminosity"} onClick={() => setAdvNoiseBlendMode("luminosity")}>Luminosity</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="point-row">
                    <span className="point-text">Opacity: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setAdvNoiseOpacity(value)} min={0} max={100} step={1} value={advNoiseOpacity}/>
                    <span className="point-text-mini">{advNoiseOpacity}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Scale: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setAdvNoiseScale(value)} min={1} max={2} step={0.05} value={advNoiseScale}/>
                    <span className="point-text-mini">{advNoiseScale}</span>
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

export default AdversarialNoise