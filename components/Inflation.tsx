import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, AppendBytesContext, patterns} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import {Image} from "image-js"
import "./styles/pointimage.less"
import inflationCorner from "../assets/icons/inflationcorner.png"

let gifPos = 0

const Inflation: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {appendBytes, setAppendBytes} = useContext(AppendBytesContext)
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
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
                const tiff = result?.mime === "image/tiff"
                const avif = path.extname(file.name) === ".avif"
                const ppm = path.extname(file.name) === ".ppm"
                const tga = path.extname(file.name) === ".tga"
                const jxl = path.extname(file.name) === ".jxl"
                const svg = path.extname(file.name) === ".svg"
                // if (jpg || png || gif || webp || bmp || tiff || avif) {
                const blob = new Blob([bytes])
                const url = URL.createObjectURL(blob)
                const link = `${url}#.${result.typename}`
                setImage(link)
                setImageName(file.name.slice(0, 30))
                // }
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

    const updateOutputSize = async () => {
        const r = await fetch(image)
        const size = Number(r.headers.get("Content-Length"))
        const fullSize = size + (Number(appendBytes) * 1024 * 1024)
        setFileSize(functions.readableFileSize(fullSize))
    }

    useEffect(() => {
        updateOutputSize()
    }, [appendBytes])

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

    const apply = (outputType?: string) => {
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

    const inflate = async (getLink?: boolean) => {
        const arrayBuffer = await fetch(image).then((r) => r.arrayBuffer())
        let len = Number(appendBytes) * 1000 * 1000
        let arr = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
            arr[i] = Math.floor(Math.random() * 256)
        }
        let concatenated = functions.concatTypedArrays(new Uint8Array(arrayBuffer), arr)
        const blob = new Blob([concatenated])
        const url = URL.createObjectURL(blob)
        if (getLink) return url
        functions.download(path.basename(imageName, path.extname(imageName)) + path.extname(image), url)
    }

    return (
        <div className="point-image-component">
            <div className="point-upload-container">
                <div className="point-row">
                    <span className="point-text">Image:</span>
                </div>
                <div className="point-row">
                    <label htmlFor="img" className="point-button" style={{width: "92px"}}>
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
            {image ?
            <div className="point-image-container">
                <div className="point-image-relative-container">
                    <img className="point-image-corner-img" src={inflationCorner}/>
                    <canvas className="point-image" ref={ref}></canvas>
                </div>
            </div> : null}
            {image ?
            <div className="point-image-container">
                <div className="point-image-buttons-container">
                    <button className="point-image-button" onClick={() => inflate()}>Inflate</button>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">Append Bytes:</span>
                    <input className="point-image-output-input" type="text" spellCheck="false" value={appendBytes} onChange={(event) => setAppendBytes(event.target.value)}/>
                    <span className="point-image-output-text">MB</span>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">{fileSize}</span>
                </div>
            </div> : null}
        </div>
    )
}

export default Inflation