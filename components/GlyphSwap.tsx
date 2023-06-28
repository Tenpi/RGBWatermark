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
import opentype from "opentype.js"
import "./styles/steganography.less"
import woff2JS from "../structures/woff2.js"
import woff2WASM from "../structures/woff2.wasm"

const woff2Module = woff2JS({
    locateFile(path: string) {
        if (path.endsWith(".wasm")) {
            return woff2WASM
        }
        return path
    }
})

let gifPos = 0

const GlyphSwap: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [text, setText] = useState("")
    const [font, setFont] = useState("")
    const [fontName, setFontName] = useState("")
    const [replacementJSON, setReplacementJSON] = useState({})
    const [replacementFile, setReplacementFile] = useState("")
    const [preview, setPreview] = useState(false)
    const [replacementFileName, setReplacementFileName] = useState("")
    const [error, setError] = useState("")
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const convertFromVecToUint8Array = (vector: any) => {
        const arr = []
        for (let i = 0, l = vector.size(); i < l; i++) {
            // @ts-ignore
            arr.push(vector.get(i))
        }
        return new Uint8Array(arr)
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
                    if (woff2) {
                        const vector = woff2Module.woff2Dec(bytes, bytes.byteLength)
                        bytes = convertFromVecToUint8Array(vector)
                    }
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    setFont(url)
                    setFontName(file.name.slice(0, 30))
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const removeFont = () => {
        setFont("")
        setFontName("")
    }

    const loadReplacementFile = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const json = file.name.endsWith("json")
                if (json) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    setReplacementFile(url)
                    setReplacementFileName(file.name.slice(0, 30))
                    const json = await fetch(url).then((r) => r.json())
                    setReplacementJSON(json)
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const removeReplacementFile = () => {
        setReplacementFile("")
        setReplacementFileName("")
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

    const swapFont = async () => {
        const fontObj = await opentype.load(font)
        let replaceJSON = {}
        let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let remaining = characters.split("") as any
        while (remaining.length) {
            const randIndex = Math.floor(Math.random() * remaining.length)
            replaceJSON[remaining[0]] = remaining[randIndex]
            replaceJSON[remaining[randIndex]] = remaining[0]
            remaining[0] = null 
            remaining[randIndex] = null 
            remaining = remaining.filter(Boolean)
        }
        const keys = Object.keys(replaceJSON) 
        const values = Object.values(replaceJSON)
        let swapped = [] as any
        for (let i = 0; i < keys.length; i++) {
            const oldGlyph = fontObj.charToGlyph(keys[i])
            const newGlyph = fontObj.charToGlyph(values[i])
            if (swapped.includes(oldGlyph.name)) continue
            swapped.push(oldGlyph.name)
            swapped.push(newGlyph.name)
            const tempCommands = oldGlyph.path.commands
            oldGlyph.path.commands = newGlyph.path.commands
            newGlyph.path.commands = tempCommands
            const tempWidth = oldGlyph.advanceWidth
            oldGlyph.advanceWidth = newGlyph.advanceWidth
            newGlyph.advanceWidth = tempWidth
            const tempIndex = oldGlyph.index
            oldGlyph.index = newGlyph.index
            newGlyph.index = tempIndex
            const tempBound = [oldGlyph.xMin, oldGlyph.xMax, oldGlyph.yMin, oldGlyph.yMax]
            oldGlyph.xMin = newGlyph.xMin
            oldGlyph.xMax = newGlyph.xMax
            oldGlyph.yMin = newGlyph.yMin
            oldGlyph.yMax = newGlyph.yMax
            newGlyph.xMin = tempBound[0]
            newGlyph.xMax = tempBound[1]
            newGlyph.yMin = tempBound[2]
            newGlyph.yMax = tempBound[3]
            fontObj.charToGlyph[keys[i]] = oldGlyph
            fontObj.charToGlyph[values[i]] = newGlyph
        }
        const newBuffer = fontObj.toArrayBuffer()
        const blob = new Blob([newBuffer])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(fontName, path.extname(fontName))}_swapped.ttf`, url)
        const fontface = new FontFace("swapped", `url(${url})`)
        const loaded = await fontface.load()
        // @ts-ignore
        document.fonts.add(loaded)
        const blob2 = new Blob([JSON.stringify(replaceJSON)])
        const url2 = URL.createObjectURL(blob2)
        functions.download(`${path.basename(fontName, path.extname(fontName))}_replacemap.json`, url2)
        setReplacementJSON(replaceJSON)
    }

    const swapText = () => {
        const textArr = text.split("")
        for (let i = 0; i < textArr.length; i++) {
            if (replacementJSON[textArr[i]]) textArr[i] = replacementJSON[textArr[i]]
        }
        setText(textArr.join(""))
    }

    return (
        <div className="steg-image-component">
            <div className="steg-imageoptions-container">
            <div className="steg-options-container">
                <div className="steg-upload-container">
                    <div className="steg-row">
                        <span className="steg-text">Font:</span>
                    </div>
                    <div className="steg-row">
                        <label htmlFor="img" className="steg-button" style={{width: "92px"}}>
                            <span className="button-hover">
                                <span className="button-text">Upload</span>
                                <img className="button-image" src={uploadIcon}/>
                            </span>
                        </label>
                        <input id="img" type="file" onChange={(event) => loadFont(event)}/>
                        {font ? 
                            <div className="button-image-name-container">
                                <img className="button-image-icon" src={xIcon} onClick={removeFont}/>
                                <span className="button-image-name">{fontName}</span>
                            </div>
                        : null}
                    </div>
                </div>
            </div>
            <canvas className="steg-image" ref={ref} style={{display: "none"}}></canvas>
            <div className="steg-options-container">
                <div className="steg-upload-container">
                    <div className="steg-row">
                        <label htmlFor="embedFile" className="steg-image-button" style={{backgroundColor: "#dd34a5", marginTop: "0px", marginBottom: "0px", marginLeft: "0px", marginRight: "0px"}}>
                            <span className="button-hover">
                                <span className="button-text" style={{fontSize: "17px"}}>Replacement File</span>
                            </span>
                        </label>
                        <input id="embedFile" type="file" onChange={(event) => loadReplacementFile(event)}/>
                        {replacementFile ? 
                            <div className="button-image-name-container">
                                <img className="button-image-icon" src={xIcon} style={{filter: functions.calculateFilter("#dd34a5"), height: "12px"}} onClick={removeReplacementFile}/>
                                <span className="button-image-name">{replacementFileName}</span>
                            </div>
                        : null}
                    </div>
                    <div className="steg-row">
                        <span className="steg-text">Text:</span> 
                    </div>
                    <div className="steg-row">
                        <textarea className="steg-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}
                        style={preview ? {fontFamily: "swapped"} : {}}></textarea>
                    </div>
                </div>
            </div>
            {error ? <span className="steg-error">{error}</span> : null}
            <div className="steg-image-container">
                    <div className="steg-image-buttons-container">
                        <button className="steg-image-button" onClick={swapFont} style={{backgroundColor: "#400bff"}}>Swap Font</button>
                        <button className="steg-image-button" onClick={swapText} style={{backgroundColor: "#ff0bc3"}}>Swap Text</button>
                        <button className="steg-image-button" onClick={() => setPreview((prev: boolean) => !prev)} style={{backgroundColor: "#2d58f7"}}>Preview</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GlyphSwap