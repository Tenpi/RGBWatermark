import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, patterns} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import {Image} from "image-js"
import JSZip from "jszip"
import ai from "../assets/icons/AI/ai.png"
import aiFan from "../assets/icons/AI/ai-fan.png"
import aiChip from "../assets/icons/AI/ai-chip.png"
import aiPencil from "../assets/icons/AI/ai-pencil.png"
import imagesMeta from "images-meta"
import "./styles/aiwatermark.less"

let gifPos = 0

const AIWatermark: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [aiWatermarkPosition, setAIWatermarkPosition] = useState("top left")
    const [aiWatermarkType, setAIWatermarkType] = useState("fan")
    const [aiWatermarkHue, setAIWatermarkHue] = useState(0)
    const [aiWatermarkSaturation, setAIWatermarkSaturation] = useState(0)
    const [aiWatermarkBrightness, setAIWatermarkBrightness] = useState(0)
    const [aiWatermarkInvert, setAIWatermarkInvert] = useState(false)
    const [aiWatermarkOpacity, setAIWatermarkOpacity] = useState(100)
    const [aiWatermarkMarginX, setAIWatermarkMarginX] = useState(10)
    const [aiWatermarkMarginY, setAIWatermarkMarginY] = useState(10)
    const [aiWatermarkScale, setAIWatermarkScale] = useState(0.7)
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [watermarkImg, setWatermarkImg] = useState(null as HTMLImageElement | null)
    const [fileSize, setFileSize] = useState("")
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
                const bmp = result?.mime === "image/bmp"
                const avif = path.extname(file.name) === ".avif"
                if (jpg || png || gif || webp || bmp || avif) {
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

    const getOutputDimensions = (imgOverride?: HTMLImageElement) => {
        if (!img) return {width: 0, height: 0}
        let imgElement = imgOverride ? imgOverride : img
        let destSize = outputSize
        if (Number.isNaN(destSize)) destSize = 100
        const width = Math.floor((destSize / 100) * imgElement.width)
        const height = Math.floor((destSize / 100) * imgElement.height)
        return {width, height}
    }

    const draw = (gifPos: number, renderWidth?: boolean, canvasOverride?: HTMLCanvasElement, imgOverride?: HTMLImageElement) => {
        if (!ref.current || !img) return ""
        let canvas = canvasOverride ? canvasOverride : ref.current 
        let imgElement = imgOverride ? imgOverride : img
        const refCtx = canvas.getContext("2d")!
        refCtx.clearRect(0, 0, canvas.width, canvas.height)
        if (renderWidth) {
            const dimensions = getOutputDimensions(imgElement)
            canvas.width = dimensions.width
            canvas.height = dimensions.height
        } else {
            let greaterValue = imgElement.width > imgElement.height ? imgElement.width : imgElement.height
            const ratio = greaterValue / 1000
            canvas.width = Math.floor(imgElement.width / ratio)
            canvas.height = Math.floor(imgElement.height / ratio)
        }
        refCtx.save()
        if (gifData) {
            const frame = gifData[gifPos].frame
            let delay = gifData[gifPos].delay
            if (delay < 0) delay = 0
            refCtx?.drawImage(frame, 0, 0, imgElement.width, imgElement.height, 0, 0, canvas.width, canvas.height)
        } else {
            refCtx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height, 0, 0, canvas.width, canvas.height)
        }
        refCtx.restore()
    }

    const getWatermarkCanvas = () => {
        const canvas = document.createElement("canvas")
        if (!watermarkImg) return canvas 
        canvas.width = Math.floor(watermarkImg.width / 4 * aiWatermarkScale)
        canvas.height = Math.floor(watermarkImg.height / 4 * aiWatermarkScale)
        const ctx = canvas.getContext("2d")!
        ctx.scale(aiWatermarkScale, aiWatermarkScale)
        ctx.globalAlpha = aiWatermarkOpacity / 100
        // ctx.imageSmoothingEnabled = false
        ctx.filter = `invert(${aiWatermarkInvert ? 1 : 0}) hue-rotate(${aiWatermarkHue + (aiWatermarkInvert ? 180 : 0)}deg) saturate(${100 + aiWatermarkSaturation}%) brightness(${100 + aiWatermarkBrightness}%)`
        ctx.drawImage(watermarkImg, 0, 0, canvas.width, canvas.height)
        return canvas
    }

    const applyWatermark = (outputType?: string, canvasOverride?: HTMLCanvasElement) => {
        if (!ref.current) return 
        let canvas = canvasOverride ? canvasOverride : ref.current 
        const ctx = canvas.getContext("2d")!
        let greaterRatio = canvas.width > canvas.height ? canvas.width : canvas.height

        const watermarkCanvas = getWatermarkCanvas()
        const waterWidth = Math.ceil(greaterRatio / (1000 / watermarkCanvas.width))
        const waterHeight =  Math.ceil(greaterRatio / (1000 / watermarkCanvas.height))
        const width =  Math.ceil(greaterRatio / (1000 / canvas.width))
        const height =  Math.ceil(greaterRatio / (1000 / canvas.height))
        const marginX =  Math.ceil(greaterRatio / (1000 / aiWatermarkMarginX))
        const marginY =  Math.ceil(greaterRatio / (1000 / aiWatermarkMarginY))

        if (aiWatermarkPosition === "top left") {
            ctx.drawImage(watermarkCanvas, marginX, marginY, waterWidth, waterHeight)
        } else if (aiWatermarkPosition === "top right") {
            ctx.drawImage(watermarkCanvas, width - waterWidth + marginX + 50, marginY, waterWidth, waterHeight)
        } else if (aiWatermarkPosition === "bottom left") {
            ctx.drawImage(watermarkCanvas, marginX, height - waterHeight - marginY + 30, waterWidth, waterHeight)
        } else if (aiWatermarkPosition === "bottom right") {
            ctx.drawImage(watermarkCanvas, width - waterWidth + marginX + 50, height - waterHeight - marginY + 30, waterWidth, waterHeight)
        }

        if (outputType === "buffer") {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            return img.data.buffer
        }
        return canvas.toDataURL(outputType ? outputType : "image/png")
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

    const getWatermarkImage = () => {
        if (aiWatermarkType === "none") return ai
        if (aiWatermarkType === "fan") return aiFan
        if (aiWatermarkType === "chip") return aiChip
        if (aiWatermarkType === "pencil") return aiPencil
        return ai
    }

    const loadWatermarkImg = () => {
        const imgElement = document.createElement("img")
        imgElement.src = getWatermarkImage()
        imgElement.crossOrigin = "Anonymous"
        imgElement.onload = () => {
            setWatermarkImg(imgElement)
        }
    }

    useEffect(() => {
        loadWatermarkImg()
    }, [aiWatermarkType])

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
            applyWatermark()
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
    }, [img, watermarkImg, gifData, seed, aiWatermarkPosition, aiWatermarkType, aiWatermarkHue, aiWatermarkSaturation, aiWatermarkBrightness, aiWatermarkInvert, aiWatermarkOpacity, aiWatermarkMarginX, aiWatermarkMarginY, aiWatermarkScale])

    const jpg = async (imageOverride?: string, canvasOverride?: HTMLCanvasElement, imgOverride?: HTMLImageElement, noDL?: boolean) => {
        let imageLink = imageOverride ? imageOverride : image
        draw(0, true, canvasOverride, imgOverride)
        const img = applyWatermark("image/jpeg", canvasOverride) as string
        let inMime = "image/jpeg"
        if (path.extname(imageLink) === ".png") inMime = "image/png"
        const arrayBuffer = await fetch((imageLink)).then((r) => r.arrayBuffer())
        const meta = imagesMeta.readMeta(Buffer.from(arrayBuffer), inMime)
        for (let i = 0; i < meta.length; i++) {
            if (typeof meta[i].value !== "string") meta[i].value = ""
            meta[i].value = meta[i].value.replaceAll("UNICODE", "").replaceAll(/\u0000/g, "")
        }
        let metaBuffer = imagesMeta.writeMeta(img, "image/jpeg", meta, "buffer")
        const blob = new Blob([metaBuffer])
        const url = URL.createObjectURL(blob)
        if (noDL) return url
        functions.download(`${path.basename(imageName, path.extname(imageName))}_aiwatermark.jpg`, url)
    }

    const png = async (imageOverride?: string, canvasOverride?: HTMLCanvasElement, imgOverride?: HTMLImageElement, noDL?: boolean) => {
        let imageLink = imageOverride ? imageOverride : image
        draw(0, true, canvasOverride, imgOverride)
        const img = applyWatermark("image/png", canvasOverride) as string
        let inMime = "image/jpeg"
        if (path.extname(imageLink) === ".png") inMime = "image/png"
        const arrayBuffer = await fetch((imageLink)).then((r) => r.arrayBuffer())
        const meta = imagesMeta.readMeta(Buffer.from(arrayBuffer), inMime)
        for (let i = 0; i < meta.length; i++) {
            if (typeof meta[i].value !== "string") meta[i].value = ""
            meta[i].value = meta[i].value.replaceAll("UNICODE", "").replaceAll(/\u0000/g, "")
        }
        let metaBuffer = imagesMeta.writeMeta(img, "image/png", meta, "buffer")
        const blob = new Blob([metaBuffer])
        const url = URL.createObjectURL(blob)
        if (noDL) return url
        functions.download(`${path.basename(imageName, path.extname(imageName))}_aiwatermark.png`, url)
    }

    const loadImages = async (event: any) => {
        const files = event.target.files
        let images = [] as string[]
        let imageNames = [] as string[]
        if (!files?.[0]) return {images, imageNames}
        const fileReader = new FileReader()
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            imageNames.push(file.name)
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    let bytes = new Uint8Array(f.target.result)
                    const result = fileType(bytes)?.[0]
                    const jpg = result?.mime === "image/jpeg"
                    const png = result?.mime === "image/png"
                    const gif = result?.mime === "image/gif"
                    const webp = result?.mime === "image/webp"
                    const bmp = result?.mime === "image/bmp"
                    const avif = path.extname(file.name) === ".avif"
                    if (jpg || png || gif || webp || bmp || avif) {
                        const blob = new Blob([bytes])
                        const url = URL.createObjectURL(blob)
                        const link = `${url}#.${result.typename}`
                        images.push(link)
                    }
                    resolve()
                }
                fileReader.readAsArrayBuffer(file)
            })
        }
        if (event.target) event.target.value = ""
        return {images, imageNames}
    }

    const bulkJPG = async (event: any) => {
        const {images, imageNames} = await loadImages(event)
        if (!images) return
        const zip = new JSZip()
        for (let i = 0; i < images.length; i++) {
            const canvas = document.createElement("canvas")
            const img = document.createElement("img")
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.src = images[i]
            })
            try {
                const url = await jpg(images[i], canvas, img, true)
                const data = await fetch(url!).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageNames[i], path.extname(imageNames[i]))}_aiwatermark ${i + 1}.jpg`, data, {binary: true})
            } catch {
                continue
            }
        }
        const filename = `${path.basename(imageNames[0], path.extname(imageNames[0]))}_aiwatermark.zip`
        const blob = await zip.generateAsync({type: "blob"})
        const url = window.URL.createObjectURL(blob)
        functions.download(filename, url)
        window.URL.revokeObjectURL(url)
    }

    const bulkPNG = async (event: any) => {
        const {images, imageNames} = await loadImages(event)
        if (!images) return
        const zip = new JSZip()
        for (let i = 0; i < images.length; i++) {
            const canvas = document.createElement("canvas")
            const img = document.createElement("img")
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.src = images[i]
            })
            try {
                const url = await png(images[i], canvas, img, true)
                const data = await fetch(url!).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageNames[i], path.extname(imageNames[i]))}_aiwatermark ${i + 1}.png`, data, {binary: true})
            } catch {
                continue
            }
        }
        const filename = `${path.basename(imageNames[0], path.extname(imageNames[0]))}_aiwatermark.zip`
        const blob = await zip.generateAsync({type: "blob"})
        const url = window.URL.createObjectURL(blob)
        functions.download(filename, url)
        window.URL.revokeObjectURL(url)
    }

    const reset = () => {
        setAIWatermarkPosition("top left")
        setAIWatermarkType("fan")
        setAIWatermarkHue(0)
        setAIWatermarkSaturation(0)
        setAIWatermarkBrightness(0)
        setAIWatermarkInvert(false)
        setAIWatermarkOpacity(100)
        setAIWatermarkMarginX(10)
        setAIWatermarkMarginY(10)
        setAIWatermarkScale(0.7)
    }

    useEffect(() => {
        const savedWatermarkPosition = localStorage.getItem("aiWatermarkPosition")
        if (savedWatermarkPosition) setAIWatermarkPosition(savedWatermarkPosition)
        const savedWatermarkType = localStorage.getItem("aiWatermarkType")
        if (savedWatermarkType) setAIWatermarkType(savedWatermarkType)
        const savedWatermarkHue = localStorage.getItem("aiWatermarkHue")
        if (savedWatermarkHue) setAIWatermarkHue(Number(savedWatermarkHue))
        const savedWatermarkSaturation = localStorage.getItem("aiWatermarkSaturation")
        if (savedWatermarkSaturation) setAIWatermarkSaturation(Number(savedWatermarkSaturation))
        const savedWatermarkBrightness = localStorage.getItem("aiWatermarkBrightness")
        if (savedWatermarkBrightness) setAIWatermarkBrightness(Number(savedWatermarkBrightness))
        const savedWatermarkInvert = localStorage.getItem("aiWatermarkInvert")
        if (savedWatermarkInvert) setAIWatermarkInvert(savedWatermarkInvert === "true")
        const savedWatermarkOpacity = localStorage.getItem("aiWatermarkOpacity")
        if (savedWatermarkOpacity) setAIWatermarkOpacity(Number(savedWatermarkOpacity))
        const savedWatermarkMarginX = localStorage.getItem("aiWatermarkMarginX")
        if (savedWatermarkMarginX) setAIWatermarkMarginX(Number(savedWatermarkMarginX))
        const savedWatermarkMarginY = localStorage.getItem("aiWatermarkMarginY")
        if (savedWatermarkMarginY) setAIWatermarkMarginY(Number(savedWatermarkMarginY))
        const savedWatermarkScale = localStorage.getItem("aiWatermarkScale")
        if (savedWatermarkScale) setAIWatermarkScale(Number(savedWatermarkScale))
    }, [])

    useEffect(() => {
        localStorage.setItem("aiWatermarkPosition", aiWatermarkPosition)
        localStorage.setItem("aiWatermarkType", aiWatermarkType)
        localStorage.setItem("aiWatermarkHue", String(aiWatermarkHue))
        localStorage.setItem("aiWatermarkSaturation", String(aiWatermarkSaturation))
        localStorage.setItem("aiWatermarkBrightness", String(aiWatermarkBrightness))
        localStorage.setItem("aiWatermarkInvert", String(aiWatermarkInvert))
        localStorage.setItem("aiWatermarkOpacity", String(aiWatermarkOpacity))
        localStorage.setItem("aiWatermarkMarginX", String(aiWatermarkMarginX))
        localStorage.setItem("aiWatermarkMarginY", String(aiWatermarkMarginY))
        localStorage.setItem("aiWatermarkScale", String(aiWatermarkScale))
    }, [aiWatermarkPosition, aiWatermarkType, aiWatermarkHue, aiWatermarkSaturation, aiWatermarkBrightness, aiWatermarkInvert, aiWatermarkOpacity, aiWatermarkMarginX, aiWatermarkMarginY, aiWatermarkScale])

    return (
        <div className="aiwatermark-image-component">
            <div className="aiwatermark-imageoptions-container">
            <div className="aiwatermark-options-container">
                <div className="aiwatermark-upload-container">
                    <div className="aiwatermark-row">
                        <span className="aiwatermark-text">Image:</span>
                    </div>
                    <div className="aiwatermark-row">
                        <label htmlFor="img" className="aiwatermark-button" style={{width: "92px"}}>
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
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Opacity: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkOpacity(value)} min={0} max={100} step={1} value={aiWatermarkOpacity}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkOpacity}</span>
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Hue: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkHue(value)} min={-180} max={180} step={1} value={aiWatermarkHue}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkHue}</span>
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Saturation: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkSaturation(value)} min={-100} max={200} step={1} value={aiWatermarkSaturation}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkSaturation}</span>
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Brightness: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkBrightness(value)} min={-100} max={200} step={1} value={aiWatermarkBrightness}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkBrightness}</span>
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Margin X: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkMarginX(value)} min={-30} max={50} step={1} value={aiWatermarkMarginX}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkMarginX}</span>
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Margin Y: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkMarginY(value)} min={-30} max={50} step={1} value={aiWatermarkMarginY}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkMarginY}</span>
                </div>
                <div className="aiwatermark-row">
                    <span className="aiwatermark-text">Scale: </span>
                    <Slider className="aiwatermark-slider" trackClassName="aiwatermark-slider-track" thumbClassName="aiwatermark-slider-thumb" onChange={(value) => setAIWatermarkScale(value)} min={0.5} max={1} step={0.05} value={aiWatermarkScale}/>
                    <span className="aiwatermark-text-mini">{aiWatermarkScale}</span>
                </div>
                <div className="aiwatermark-row" style={{justifyContent: "center"}}>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkInvert((prev: boolean) => !prev)} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small`}>Invert</span>
                        </span>
                    </button>
                </div>
                <div className="aiwatermark-row" style={{justifyContent: "center"}}>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkType("none")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkType === "none" ? "button-text-selected" : ""}`}>None</span>
                        </span>
                    </button>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkType("fan")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkType === "fan" ? "button-text-selected" : ""}`}>Fan</span>
                        </span>
                    </button>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkType("chip")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkType === "chip" ? "button-text-selected" : ""}`}>Chip</span>
                        </span>
                    </button>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkType("pencil")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkType === "pencil" ? "button-text-selected" : ""}`}>Pencil</span>
                        </span>
                    </button>
                </div>
                <div className="aiwatermark-row" style={{justifyContent: "center"}}>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkPosition("top left")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkPosition === "top left" ? "button-text-selected" : ""}`}>Top Left</span>
                        </span>
                    </button>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkPosition("top right")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkPosition === "top right" ? "button-text-selected" : ""}`}>Top Right</span>
                        </span>
                    </button>
                </div>
                <div className="aiwatermark-row" style={{justifyContent: "center"}}>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkPosition("bottom left")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkPosition === "bottom left" ? "button-text-selected" : ""}`}>Bottom Left</span>
                        </span>
                    </button>
                    <button className="aiwatermark-button-small" onClick={() => setAIWatermarkPosition("bottom right")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small ${aiWatermarkPosition === "bottom right" ? "button-text-selected" : ""}`}>Bottom Right</span>
                        </span>
                    </button>
                </div>
                <div className="aiwatermark-row" style={{justifyContent: "center"}}>
                    <button className="aiwatermark-button-small" onClick={reset} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`aiwatermark-button-text-small`}>Reset</span>
                        </span>
                    </button>
                </div>
            </div>
            <div className="aiwatermark-image-bigcontainer">
                {image ?
                <div className="aiwatermark-image-container">
                    <div className="aiwatermark-image-relative-container">
                        <canvas className="aiwatermark-image" ref={ref}></canvas>
                    </div>
                </div> : null}
                {image ?
                <div className="aiwatermark-image-container">
                    <div className="aiwatermark-image-buttons-container">
                        <button className="aiwatermark-image-button" onClick={() => jpg()}>JPG</button>
                        <button className="aiwatermark-image-button" onClick={() => png()}>PNG</button>
                        <label htmlFor="jpg" className="aiwatermark-image-button">
                            <span className="button-hover">
                                <span className="button-text" style={{fontSize: "20px"}}>Bulk JPG</span>
                            </span>
                        </label>
                        <input id="jpg" type="file" multiple={true} onChange={(event) => bulkJPG(event)}/>
                        <label htmlFor="png" className="aiwatermark-image-button">
                            <span className="button-hover">
                                <span className="button-text" style={{fontSize: "20px"}}>Bulk PNG</span>
                            </span>
                        </label>
                        <input id="png" type="file" multiple={true} onChange={(event) => bulkPNG(event)}/>
                    </div>
                </div> : null}
            </div>
            </div>
        </div>
    )
}

export default AIWatermark