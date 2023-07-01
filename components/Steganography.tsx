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
import {RawFile, StegImage, utils} from "steg"
import {scrypt} from "@noble/hashes/scrypt"
import "./styles/steganography.less"
import jphsJS from "../structures/jphs.js"
import jphsWASM from "../structures/jphs.wasm"

const jphsModule = jphsJS({
    locateFile(path: string) {
        if (path.endsWith(".wasm")) {
            return jphsWASM
        }
        return path
    }
})

let gifPos = 0

const Steganography: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [text, setText] = useState("")
    const [encryptionKey, setEncryptionKey] = useState("")
    const [filename, setFilename] = useState("secret.txt")
    const [embedFile, setEmbedFile] = useState("")
    const [embedFileName, setEmbedFileName] = useState("")
    const [error, setError] = useState("")
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

    const loadFile = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const blob = new Blob([bytes])
                const url = URL.createObjectURL(blob)
                setEmbedFile(url)
                setEmbedFileName(file.name.slice(0, 30))
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

    const removeEmbedFile = () => {
        setEmbedFile("")
        setEmbedFileName("")
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

    const hide = async () => {
        if (path.extname(image).toLowerCase() === ".png") {
            let file = null as any
            if (embedFile) {
                const arrayBuffer = await fetch(embedFile).then((r) => r.arrayBuffer())
                file = new RawFile(new Uint8Array(arrayBuffer), filename)
            } else {
                file = new RawFile(utils.utf8ToBytes(text), filename)
            }
            const png = new StegImage(img!)
            const passwordKey = scrypt(encryptionKey, "klee", {N:2**16, r:8, p:1})
            try {
                const url = await png.hide(file, passwordKey)
                functions.download(`${path.basename(imageName, path.extname(imageName))}_steganography.png`, url)
            } catch {
                setError("File too big to store!")
                setTimeout(() => {setError("")}, 2000)
            }
        } else {
            draw(0, true)
            const dataURL = convert("image/jpeg") as string
            const arrayBuffer = await fetch(dataURL).then((r) => r.arrayBuffer())
            jphsModule.FS.writeFile("hide.jpg", new Uint8Array(arrayBuffer))
            if (embedFile) {
                const fileBuffer = await fetch(embedFile).then((r) => r.arrayBuffer())
                jphsModule.FS.writeFile(filename, new Uint8Array(fileBuffer))
            } else {
                jphsModule.FS.writeFile(filename, text)
            }
            try {
                jphsModule.ccall("hide", "number", ["string", "string", "string", "string"], ["hide.jpg", "output.jpg", filename, encryptionKey], null)
                const contents = jphsModule.FS.readFile("output.jpg")
                const blob = new Blob([contents])
                const url = URL.createObjectURL(blob)
                functions.download(`${path.basename(imageName, path.extname(imageName))}_steganography.jpg`, url)
                jphsModule.FS.unlink("hide.jpg")
                jphsModule.FS.unlink("output.jpg")
                jphsModule.FS.unlink(filename)
            } catch {
                setError("File too big to store!")
                setTimeout(() => {setError("")}, 2000)
            }
        }
    }

    const retrieve = async () => {
        if (path.extname(image).toLowerCase() === ".png") {
            const png = new StegImage(img!)
            const passwordKey = scrypt(encryptionKey, "klee", {N:2**16, r:8, p:1})
            try {
                const file = await png.reveal(passwordKey)
                const blob = new Blob([file.data])
                const url = URL.createObjectURL(blob)
                functions.download(filename, url)
            } catch {
                setError("Doesn't appear to have a message...")
                setTimeout(() => {setError("")}, 2000)
            }
        } else if (path.extname(image).toLowerCase() === ".jpg" || path.extname(image).toLowerCase() === ".jpeg") {
            const arrayBuffer = await fetch(image).then((r) => r.arrayBuffer())
            jphsModule.FS.writeFile("seek.jpg", new Uint8Array(arrayBuffer))
            try {
                jphsModule.ccall("seek", "number", ["string", "string", "string"], ["seek.jpg", filename, encryptionKey], null)
                const contents = jphsModule.FS.readFile(filename)
                const blob = new Blob([contents])
                const url = URL.createObjectURL(blob)
                functions.download(filename, url)
                jphsModule.FS.unlink("seek.jpg")
            } catch {
                setError("Doesn't appear to have a message...")
                setTimeout(() => {setError("")}, 2000)
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
            {/* <div className="steg-image-bigcontainer">
                {image ?
                <div className="steg-image-container">
                    <div className="steg-image-relative-container">
                        <canvas className="steg-image" ref={ref}></canvas>
                    </div>
                </div> : null}
            </div> */}
            <div className="steg-options-container">
                <div className="steg-upload-container">
                    <div className="steg-row">
                        <label htmlFor="embedFile" className="steg-image-button" style={{backgroundColor: "#dd34a5", marginTop: "0px", marginBottom: "0px", marginLeft: "0px", marginRight: "0px"}}>
                            <span className="button-hover">
                                <span className="button-text" style={{fontSize: "17px"}}>Hidden File</span>
                            </span>
                        </label>
                        <input id="embedFile" type="file" onChange={(event) => loadFile(event)}/>
                        {embedFile ? 
                            <div className="button-image-name-container">
                                <img className="button-image-icon" src={xIcon} style={{height: "12px"}} onClick={removeEmbedFile}/>
                                <span className="button-image-name">{embedFileName}</span>
                            </div>
                        : null}
                    </div>
                    <div className="steg-row">
                        <span className="steg-text">Text:</span> 
                    </div>
                    <div className="steg-row">
                        <textarea className="steg-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}></textarea>
                    </div>
                    <div className="steg-row">
                        <span className="steg-text">Encryption Key:</span>
                        <input className="steg-input" spellCheck={false} value={encryptionKey} onChange={(event) => setEncryptionKey(event.target.value)} style={{width: "200px"}}></input>
                    </div>
                    <div className="steg-row">
                        <span className="steg-text">Filename:</span>
                        <input className="steg-input" spellCheck={false} value={filename} onChange={(event) => setFilename(event.target.value)} style={{width: "100px"}}></input>
                    </div>
                </div>
            </div>
            {error ? <span className="steg-error">{error}</span> : null}
            <div className="steg-image-container">
                    <div className="steg-image-buttons-container">
                        <button className="steg-image-button" onClick={hide} style={{backgroundColor: "#400bff"}}>Hide</button>
                        <button className="steg-image-button" onClick={retrieve} style={{backgroundColor: "#ff0bc3"}}>Retrieve</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Steganography