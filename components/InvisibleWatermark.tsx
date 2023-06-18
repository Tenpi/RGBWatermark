import {ipcRenderer, shell} from "electron"
import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, ImagePathContext, patterns} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import xIcon2 from "../assets/icons/x2.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import {Image} from "image-js"
import {RawFile, StegImage, utils} from "steg"
import {scrypt} from "@noble/hashes/scrypt"
import "./styles/steganography.less"

let gifPos = 0

const InvisibleWatermark: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [destFolder, setDestFolder] = useState("")
    const {imagePath, setImagePath} = useContext(ImagePathContext)
    const [text, setText] = useState("")
    const [padLength, setPadLength] = useState("100")
    const [revealText, setRevealText] = useState("")
    const [error, setError] = useState("")
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        ipcRenderer.invoke("get-downloads-folder").then((f) => {
            f = f.replace(/\\/g, "/")
            if (!f.endsWith("/")) f = `${f}/`
            setDestFolder(f)
        })
    }, [])

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
                const bmp = result?.mime === "image/bmp"
                const avif = path.extname(file.name) === ".avif"
                if (jpg || png || gif || webp || bmp || avif) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setImage(link)
                    setImagePath(file.path)
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
        setImagePath("")
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

    const convert = (outputType?: string) => {
        if (!ref.current) return 
        const ctx = ref.current.getContext("2d")!
        if (outputType === "buffer") {
            const img = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
            return img.data.buffer
        }
        return ref.current.toDataURL(outputType ? outputType : "image/png")
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
    }, [img, gifData, seed])

    const encode = async () => {
        if (imagePath && destFolder && text && !Number.isNaN(Number(padLength))) {
            try {
                let newName = `${path.basename(imagePath, path.extname(imagePath))}_invisiblewatermark${path.extname(imagePath)}`
                const dest = path.join(destFolder, newName)
                const padded = functions.padString(text, Number(padLength))
                await ipcRenderer.invoke("invisible-watermark-encode", imagePath, dest, padded)
            } catch (err) {
                console.error(err)
                setError("Error: Check Developer Tools (Ctrl+Shift+I)")
                setTimeout(() => {
                    setError("")
                }, 5000)
            }
        }
    }

    const decode = async () => {
        if (imagePath) {
            try {
                const revealText = await ipcRenderer.invoke("invisible-watermark-decode", imagePath, padLength)
                setRevealText(revealText)
                // StableDiffusionV1 17
                // SDV2 4
            } catch (err) {
                console.error(err)
                setError("Error: Check Developer Tools (Ctrl+Shift+I)")
                setTimeout(() => {
                    setError("")
                }, 5000)
            }
        }
    }

    return (
        <div className="steg-image-component">
            <div className="steg-imageoptions-container">
            <div className="steg-options-container">
                <div className="steg-upload-container">
                    <div className="steg-row">
                        <span className="steg-text">Image:</span>
                    </div>
                    <div className="steg-row">
                        <label htmlFor="img" className="steg-button" style={{width: "92px"}}>
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
            </div>
            <canvas className="steg-image" ref={ref} style={{display: "none"}}></canvas>
            <div className="steg-options-container">
                <div className="steg-upload-container">
                    <div className="steg-row">
                        <span className="steg-text">Text:</span> 
                    </div>
                    <div className="steg-row">
                        <textarea className="steg-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} style={{minHeight: "80px"}}></textarea>
                    </div>
                    <div className="steg-row">
                        <span className="steg-text">Pad Length:</span>
                        <input className="steg-input" spellCheck={false} value={padLength} onChange={(event) => setPadLength(event.target.value)} style={{width: "200px"}}></input>
                    </div>
                    <div className="steg-row">
                        <input className="steg-input" readOnly={true} spellCheck={false} value={revealText} style={{margin: "0px", width: "100%", backgroundColor: "#14154f"}}></input>
                    </div>
                </div>
                <div className="steg-row">
                    <span className="steg-text-2">AI Watermarks:</span>
                </div>
                <div className="steg-row" style={{marginTop: "5px"}}>
                    <span className="steg-text" style={{fontSize: "19px"}}>StableDiffusionV1, Pad Length = 17</span>
                </div>
                <div className="steg-row" style={{marginTop: "5px"}}>
                    <span className="steg-text" style={{fontSize: "19px"}}>SDV2, Pad Length = 4</span>
                </div>
                <div className="steg-row">
                    <span className="steg-text-2">Requirements:</span>
                </div>
                <div className="steg-row" style={{marginTop: "5px"}}>
                    <span className="steg-text" style={{fontSize: "19px"}}>Download Python (<span className="network-link" style={{fontSize: "18px"}} onClick={() => shell.openExternal("https://www.python.org/downloads/")}>https://www.python.org/downloads/</span>)</span>
                </div>
            </div>
            {error ? <span className="steg-error">{error}</span> : null}
            <div className="steg-image-container">
                    <div className="steg-image-buttons-container">
                        <button className="steg-image-button" onClick={encode} style={{backgroundColor: "#5f8aff"}}>Encode</button>
                        <button className="steg-image-button" onClick={decode} style={{backgroundColor: "#ff64d9"}}>Decode</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvisibleWatermark