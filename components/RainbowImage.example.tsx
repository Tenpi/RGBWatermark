// @ts-nocheck
import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {EnableDragContext, MobileContext, ImageContext, TextContext, WatermarkImageContext, FontContext, BlendModeContext, OutputSizeContext, ImbalanceContext,
OpacityContext, SizeContext, SpeedContext, MarginContext, AngleContext, ImageNameContext, ReverseContext, TypeContext, PatternContext, HighCoverageContext,
ColorStopContext, SaturationContext, BrightnessContext, StopAnimationContext, PixelateContext, VarianceContext, RotationSpeedContext, 
HueContext, PosXContext, PosYContext, patterns} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import gifFrames from "gif-frames"
import reverseIcon from "../assets/icons/reverse.png"
import JSZip from "jszip"
import "./styles/rainbowimage.less"

let pos = 0
let gifPos = 0
let rotatePos = 0

const RainbowImage: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {watermarkImage, setWatermarkImage} = useContext(WatermarkImageContext)
    const {font, setFont} = useContext(FontContext)
    const {blendMode, setBlendMode} = useContext(BlendModeContext)
    const {text, setText} = useContext(TextContext)
    const {opacity, setOpacity} = useContext(OpacityContext)
    const {size, setSize} = useContext(SizeContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const {margin, setMargin} = useContext(MarginContext)
    const {angle, setAngle} = useContext(AngleContext)
    const {type, setType} = useContext(TypeContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {colorStops, setColorStops} = useContext(ColorStopContext)
    const {pattern, setPattern} = useContext(PatternContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {variance, setVariance} = useContext(VarianceContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {stopAnimations, setStopAnimations} = useContext(StopAnimationContext)
    const {rotationSpeed, setRotationSpeed} = useContext(RotationSpeedContext)
    const {highCoverage, setHighCoverage} = useContext(HighCoverageContext)
    const {imbalance, setImbalance} = useContext(ImbalanceContext)
    const {hue, setHue} = useContext(HueContext)
    const {posX, setPosX} = useContext(PosXContext)
    const {posY, setPosY} = useContext(PosYContext)
    const [gifData, setGIFData] = useState(null) as any
    const [img, setImg] = useState(null as HTMLImageElement | null) 
    const [watermarkImg, setWatermarkImg] = useState(null as HTMLImageElement | null) 
    const [patternImg, setPatternImg] = useState(null as HTMLImageElement | null) 
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

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
        if (type === "image" || type === "pattern") refCtx.resetTransform()
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

    const applyWatermark = async (pos: number, rotatePos: number, outputType?: string) => {
    }

    const loadImage = () => {
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

    const loadWatermarkImage = () => {
        if (!watermarkImage) return setWatermarkImg(null)
        const imgElement = document.createElement("img")
        imgElement.src = watermarkImage
        imgElement.onload = () => {
            setWatermarkImg(imgElement)
        }
    }

    const loadPatternImage = async () => {
        if (type !== "pattern") return setPatternImg(null)
        const imgElement = document.createElement("img")
        const patternImage = patterns.find((p) => p.name === pattern)
        imgElement.src = patternImage?.image
        imgElement.onload = () => {
            setPatternImg(imgElement)
        }
    }

    const parseGIF = async () => {
        const frames = await gifFrames({url: image, frames: "all", outputType: "canvas"})
        const newGIFData = [] as any
        for (let i = 0; i < frames.length; i++) {
            newGIFData.push({
                frame: frames[i].getImage(),
                delay: frames[i].frameInfo.delay * 10
            })
        }
        setGIFData(newGIFData)
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
        loadImage()
        if (functions.isGIF(image)) parseGIF()
        if (functions.isWebP(image)) parseAnimatedWebP()
    }, [image])

    useEffect(() => {
        loadWatermarkImage()
    }, [watermarkImage])

    useEffect(() => {
        loadPatternImage()
    }, [pattern, type])

    useEffect(() => {
        let timeout = null as any
        const animationLoop = async () => {
            draw(gifPos)
            await applyWatermark(pos, rotatePos, "image/jpeg")
            if (stopAnimations) return
            if (rotationSpeed !== 1) {
                if (reverse) {
                    rotatePos--
                } else {
                    rotatePos++
                }
                if (rotatePos > rotationSpeed) rotatePos = 0
                if (rotatePos < 0) rotatePos = rotationSpeed
            }
            if (gifData) {
                if (reverse) {
                    gifPos--
                } else {
                    gifPos++
                }
                if (gifPos > gifData.length - 1) gifPos = 0
                if (gifPos < 0) gifPos = gifData.length - 1
            }
            pos += 1
            if (pos > colorStops.length - 1) {
                pos = 0
            }
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                let delay = speed 
                if (type === "image") delay *= 2
                timeout = setTimeout(() => {
                    resolve()
                }, delay)
            }).then(animationLoop)
        }
        animationLoop()
        return () => {
            clearTimeout(timeout)
        }
    }, [img, watermarkImg, text, watermarkImage, pattern, patternImg, type, font, blendMode, opacity, size, angle, margin, speed, reverse, colorStops, saturation, brightness, stopAnimations, gifData, rotationSpeed, variance, imbalance, hue, posX, posY, highCoverage])

    if (!image) return null

    const jpg = async () => {
        draw(0, true)
        const img = await applyWatermark(0, 0, "image/jpeg") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbwatermark.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = await applyWatermark(0, 0, "image/png") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbwatermark.png`, img)
    }

    const zip = async () => {
        const zip = new JSZip()
        if (gifData) {
            let k = 0
            let m = reverse ? rotationSpeed : 0
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const img = await applyWatermark(k, m, "image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_rgbwatermark ${i + 1}.png`, data, {binary: true})
                k++
                reverse ? m-- : m++
                if (k > colorStops.length - 1) k = 0
                if (m > rotationSpeed) m = 0
                if (m < 0) m = rotationSpeed
            }
        } else {
            let m = reverse ? rotationSpeed : 0
            for (let i = 0; i < colorStops.length; i++) {
                draw(0, true)
                const img = await applyWatermark(i, m, "image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_rgbwatermark ${i + 1}.png`, data, {binary: true})
                reverse ? m-- : m++
                if (m > rotationSpeed) m = 0
                if (m < 0) m = rotationSpeed
            }
        }
        const filename = `${path.basename(imageName, path.extname(imageName))}_rgbwatermark.zip`
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
            let k = 0
            let m = reverse ? rotationSpeed : 0
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = await applyWatermark(k, m, "buffer") as ArrayBuffer
                frames.push(frame)
                let delay = speed
                if (type === "image") delay *= 2
                if (type === "pattern") delay *= 5
                delays.push(delay)
                k++
                reverse ? m-- : m++
                if (k > colorStops.length - 1) k = 0
                if (m > rotationSpeed) m = 0
                if (m < 0) m = rotationSpeed
            }
        } else {
            let m = reverse ? rotationSpeed : 0
            for (let i = 0; i < colorStops.length; i++) {
                draw(0, true)
                const frame = await applyWatermark(i, m, "buffer") as ArrayBuffer
                frames.push(frame)
                let delay = speed
                if (type === "image") delay *= 2
                if (type === "pattern") delay *= 5
                delays.push(delay)
                reverse ? m-- : m++
                if (m > rotationSpeed) m = 0
                if (m < 0) m = rotationSpeed
            }
        }
        const dimensions = getOutputDimensions()
        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}_rgbwatermark.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="image-component" onMouseEnter={() => setEnableDrag(false)}>
            <div className="image-container">
                <canvas className="image" ref={ref}></canvas>
            </div>
            <div className="image-buttons-container">
                <img className="image-button-icon" src={reverseIcon} onClick={() => setReverse((prev: boolean) => !prev)} style={{transform: reverse ? "scaleX(-1)" : ""}}/>
                <button className="image-button" onClick={jpg}>JPG</button>
                <button className="image-button" onClick={png}>PNG</button>
                <button className="image-button" onClick={zip}>ZIP</button>
                <button className="image-button" onClick={gif}>GIF</button>
            </div>
            <div className="image-output-row">
                <span className="image-output-text">PosX: </span>
                <span className="image-output-text-mini">{Math.floor(posX)}</span>
                <Slider className="image-output-slider" trackClassName="image-output-slider-track" thumbClassName="image-output-slider-thumb" onChange={(value) => setPosX(value)} min={-100} max={100} step={1} value={posX}/>
            </div>
            <div className="image-output-row">
                <span className="image-output-text">PosY: </span>
                <span className="image-output-text-mini">{Math.floor(posY)}</span>
                <Slider className="image-output-slider" trackClassName="image-output-slider-track" thumbClassName="image-output-slider-thumb" onChange={(value) => setPosY(value)} min={-100} max={100} step={1} value={posY}/>
            </div>
            <div className="image-output-row">
                <span className="image-output-text">Output Size:</span>
                <input className="image-output-input" type="text" spellCheck="false" value={outputSize} onChange={(event) => setOutputSize(event.target.value)}/>
            </div>
            <div className="image-output-row">
                <span className="image-output-text">{getOutputDimensions().width}x{getOutputDimensions().height}</span>
            </div>
        </div>
    )
}

export default RainbowImage