import {ipcRenderer, shell} from "electron"
import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, ImagePathContext, patterns} from "../renderer"
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

const CLIPBreaker: React.FunctionComponent = (props) => {
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {imagePath, setImagePath} = useContext(ImagePathContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const [clipBreakerOpacity, setCLIPBreakerOpacity] = useState(100)
    const [clipBreakerBlendMode, setCLIPBreakerBlendMode] = useState("source-over")
    const [clipBreakerModels, setCLIPBreakerModels] = useState({deepdanbooru: true, blip: false, wdtagger: false})
    const [clipBreakerEpsilon, setCLIPBreakerEpsilon] = useState(20)
    const [clipBreakerAttack, setCLIPBreakerAttack] = useState("fgsm")
    const [gifData, setGIFData] = useState(null) as any
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [computedImage, setComputedImage] = useState("")
    const [computedImg, setComputedImg] = useState(null as HTMLImageElement | null)
    const [predictionText, setPredictionText] = useState("")
    const [computing, setComputing] = useState(false)
    const [predicting, setPredicting] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [seed, setSeed] = useState(0)
    const [error, setError] = useState("")
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        const downloadingModels = (event: any, downloading: boolean) => {
            setDownloading(downloading)
        }
        ipcRenderer.on("clipbreaker-download", downloadingModels)
        return () => {
            ipcRenderer.removeListener("clipbreaker-download", downloadingModels)
        }
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
                if (jpg || png || gif || webp) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setImage(link)
                    setImageName(file.name.slice(0, 30))
                    setImagePath(file.path)
                    setComputedImg(null)
                    setComputedImage("")
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
        setComputedImg(null)
        setComputedImage("")
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

    const applyComputedImage = (outputType?: string) => {
        if (!ref.current) return
        const ctx = ref.current.getContext("2d")!

        if (computedImg) {
            ctx.globalAlpha = clipBreakerOpacity / 100
            ctx.globalCompositeOperation = clipBreakerBlendMode as any
            ctx.drawImage(computedImg, 0, 0, ref.current.width, ref.current.height)
        }

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

    const loadComputedImg = () => {
        if (!computedImage) return setComputedImg(null)
        const imgElement = document.createElement("img")
        imgElement.src = computedImage
        imgElement.onload = () => {
            setComputedImg(imgElement)
        }
    }

    useEffect(() => {
        loadComputedImg()
    }, [computedImage])

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
            applyComputedImage()
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
    }, [img, computedImg, clipBreakerBlendMode, clipBreakerOpacity, gifData])

    const reset = () => {
        setCLIPBreakerModels({deepdanbooru: true, blip: false, wdtagger: false})
        setCLIPBreakerOpacity(100)
        setCLIPBreakerBlendMode("source-over")
        setCLIPBreakerEpsilon(20)
        setCLIPBreakerAttack("fgsm")
    }

    useEffect(() => {
        const savedCLIPBreakerModels = localStorage.getItem("clipBreakerModels")
        if (savedCLIPBreakerModels) setCLIPBreakerModels(JSON.parse(savedCLIPBreakerModels))
        const savedCLIPBreakerOpacity = localStorage.getItem("clipBreakerOpacity")
        if (savedCLIPBreakerOpacity) setCLIPBreakerOpacity(Number(savedCLIPBreakerOpacity))
        const savedCLIPBreakerBlendMode = localStorage.getItem("clipBreakerBlendMode")
        if (savedCLIPBreakerBlendMode) setCLIPBreakerBlendMode(savedCLIPBreakerBlendMode)
        const savedCLIPBreakerAttack = localStorage.getItem("clipBreakerAttack")
        if (savedCLIPBreakerAttack) setCLIPBreakerAttack(savedCLIPBreakerAttack)
        const savedCLIPBreakerEpsilon = localStorage.getItem("clipBreakerEpsilon")
        if (savedCLIPBreakerEpsilon) setCLIPBreakerEpsilon(Number(savedCLIPBreakerEpsilon))
    }, [])

    useEffect(() => {
        localStorage.setItem("clipBreakerOpacity", String(clipBreakerOpacity))
        localStorage.setItem("clipBreakerModels", JSON.stringify(clipBreakerModels))
        localStorage.setItem("clipBreakerBlendMode", clipBreakerBlendMode)
        localStorage.setItem("clipBreakerAttack", clipBreakerAttack)
        localStorage.setItem("clipBreakerEpsilon", String(clipBreakerEpsilon))
    }, [clipBreakerOpacity, clipBreakerAttack, clipBreakerBlendMode, clipBreakerEpsilon, clipBreakerModels])

    const jpg = async () => {
        draw(0, true)
        const img = applyComputedImage("image/jpeg") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_clipbreak.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = applyComputedImage("image/png") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_clipbreak.png`, img)
    }

    const compute = async () => {
        const models = getModelArray()
        if (imagePath && models.length) {
            try {
                setComputing(true)
                const computed = await ipcRenderer.invoke("clipbreaker-attack", imagePath, models, clipBreakerAttack, clipBreakerEpsilon / 255)
                setComputing(false)
                const blob = new Blob([computed])
                const url = URL.createObjectURL(blob)
                setComputedImage(url)
            } catch (err) {
                setComputing(false)
                console.error(err)
                setError("Error: Check Developer Tools (Ctrl+Shift+I)")
                setTimeout(() => {
                    setError("")
                }, 5000)
            }
        }
    }

    const predict = async () => {
        const models = getModelArray()
        if (imagePath && models.length) {
            try {
                draw(0, true)
                const base64 = applyComputedImage("image/png") as string
                setPredicting(true)
                const prediction = await ipcRenderer.invoke("clipbreaker-predict", base64, models)
                setPredicting(false)
                setPredictionText(prediction.replaceAll("_", " "))
            } catch (err) {
                setPredicting(false)
                console.error(err)
                setError("Error: Check Developer Tools (Ctrl+Shift+I)")
                setTimeout(() => {
                    setError("")
                }, 5000)
            }
        }
    }

    const deleteModels = async () => {
        await ipcRenderer.invoke("clipbreaker-delete-models")
        setError("Deleted Models!")
        setTimeout(() => {
            setError("")
        }, 2000)
    }

    const getModelArray = () => {
        const arr = [] as string[]
        if (clipBreakerModels.deepdanbooru) arr.push("deepdanbooru")
        if (clipBreakerModels.blip) arr.push("blip")
        if (clipBreakerModels.wdtagger) arr.push("wdtagger")
        return arr
    }

    const appendModel = (model: string) => {
        const models = JSON.parse(JSON.stringify(clipBreakerModels))
        if (model === "deepdanbooru") {
            models.deepdanbooru = !models.deepdanbooru
        } else if (model === "blip") {
            models.blip = !models.blip
        } else if (model === "wdtagger") {
            models.wdtagger = !models.wdtagger
        }
        setCLIPBreakerModels(models)
    }

    const getBlendMode = () => {
        if (clipBreakerBlendMode === "source-over") return "Normal"
        if (clipBreakerBlendMode === "color-dodge") return "Color Dodge"
        if (clipBreakerBlendMode === "color-burn") return "Color Burn"
        if (clipBreakerBlendMode === "hard-light") return "Hard Light"
        if (clipBreakerBlendMode === "soft-light") return "Soft Light"
        return functions.toProperCase(clipBreakerBlendMode)
    }

    const getAttack = () => {
        return clipBreakerAttack.toUpperCase()
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
                <canvas className="point-image" ref={ref}></canvas>
            </div> : null}
            <div className="point-options-container">
                <div className="point-row">
                    <span className="point-text-mini" style={{width: "auto", fontSize: "17px"}}>DeepDanbooru</span>
                    <img className="point-checkbox" src={clipBreakerModels.deepdanbooru ? checkboxChecked : checkbox} onClick={() => appendModel("deepdanbooru")} style={{marginLeft: "5px"}}/>
                    <span className="point-text-mini" style={{width: "auto", fontSize: "17px"}}>WDTagger</span>
                    <img className="point-checkbox" src={clipBreakerModels.wdtagger ? checkboxChecked : checkbox} onClick={() => appendModel("wdtagger")} style={{marginLeft: "5px"}}/>
                    <span className="point-text-mini" style={{width: "auto", fontSize: "17px"}}>BLIP</span>
                    <img className="point-checkbox" src={clipBreakerModels.blip ? checkboxChecked : checkbox} onClick={() => appendModel("blip")} style={{marginLeft: "5px"}}/>
                </div>
                <div className="point-row">
                    <span className="options-text">Attack:</span>
                    <DropdownButton title={getAttack()} drop="down">
                        <Dropdown.Item active={clipBreakerAttack === "fgsm"} onClick={() => setCLIPBreakerAttack("fgsm")}>FGSM</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerAttack === "pgd"} onClick={() => setCLIPBreakerAttack("pgd")}>PGD</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerAttack === "mifgsm"} onClick={() => setCLIPBreakerAttack("mifgsm")}>MIFGSM</Dropdown.Item>
                    </DropdownButton>
                    <span className="options-text">Blend Mode:</span>
                    <DropdownButton title={getBlendMode()} drop="down">
                        <Dropdown.Item active={clipBreakerBlendMode === "source-over"} onClick={() => setCLIPBreakerBlendMode("source-over")}>Normal</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "multiply"} onClick={() => setCLIPBreakerBlendMode("multiply")}>Multiply</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "screen"} onClick={() => setCLIPBreakerBlendMode("screen")}>Screen</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "overlay"} onClick={() => setCLIPBreakerBlendMode("overlay")}>Overlay</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "darken"} onClick={() => setCLIPBreakerBlendMode("darken")}>Darken</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "lighten"} onClick={() => setCLIPBreakerBlendMode("lighten")}>Lighten</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "color-dodge"} onClick={() => setCLIPBreakerBlendMode("color-dodge")}>Color Dodge</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "color-burn"} onClick={() => setCLIPBreakerBlendMode("color-burn")}>Color Burn</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "hard-light"} onClick={() => setCLIPBreakerBlendMode("hard-light")}>Hard Light</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "soft-light"} onClick={() => setCLIPBreakerBlendMode("soft-light")}>Soft Light</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "hue"} onClick={() => setCLIPBreakerBlendMode("hue")}>Hue</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "saturation"} onClick={() => setCLIPBreakerBlendMode("saturation")}>Saturation</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "color"} onClick={() => setCLIPBreakerBlendMode("color")}>Color</Dropdown.Item>
                        <Dropdown.Item active={clipBreakerBlendMode === "luminosity"} onClick={() => setCLIPBreakerBlendMode("luminosity")}>Luminosity</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="point-row">
                    <span className="point-text">Epsilon: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setCLIPBreakerEpsilon(value)} min={0} max={255} step={1} value={clipBreakerEpsilon}/>
                    <span className="point-text-mini">{clipBreakerEpsilon}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Opacity: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setCLIPBreakerOpacity(value)} min={0} max={100} step={1} value={clipBreakerOpacity}/>
                    <span className="point-text-mini">{clipBreakerOpacity}</span>
                </div>
                <div className="point-row" style={{marginTop: "0px"}}>
                    <button className="point-button" onClick={jpg} style={{padding: "0px 5px", marginRight: "10px"}}>
                        <span className="button-hover">
                            <span className="button-text">JPG</span>
                        </span>
                    </button>
                    <button className="point-button" onClick={png} style={{padding: "0px 5px", marginRight: "10px"}}>
                        <span className="button-hover">
                            <span className="button-text">PNG</span>
                        </span>
                    </button>
                    <button className="point-button" onClick={reset} style={{padding: "0px 5px", marginRight: "10px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                </div>
            </div>
            {downloading ? <span className="steg-error" style={{color: "#ed2672", display: "flex", justifyContent: "center", fontSize: "17px", marginTop: "5px", marginBottom: "-5px"}}>Downloading Models...</span> : null}
            {computing && !downloading ? <span className="steg-error" style={{color: "#1d22e0", display: "flex", justifyContent: "center", fontSize: "17px", marginTop: "5px", marginBottom: "-5px"}}>Computing...</span> : null}
            {predicting && !downloading ? <span className="steg-error" style={{color: "#f43bbd", display: "flex", justifyContent: "center", fontSize: "17px", marginTop: "5px", marginBottom: "-5px"}}>Predicting...</span> : null}
            {error ? <span className="steg-error" style={{display: "flex", justifyContent: "center", fontSize: "17px", marginTop: "5px", marginBottom: "-5px"}}>{error}</span> : null}
            <div className="point-image-container" style={{marginTop: "5px"}}>
                <div className="point-image-buttons-container">
                    <button className="point-image-button" onClick={compute} style={{marginLeft: "0px", marginRight: "20px", fontSize: "18px", backgroundColor: "#1d22e0"}}>Compute</button>
                    <button className="point-image-button" onClick={predict} style={{marginLeft: "0px", marginRight: "20px", fontSize: "18px", backgroundColor: "#f43bbd"}}>Predict</button>
                </div>
            </div>
            {predictionText ?
            <div className="point-row">
                <textarea className="point-textarea" readOnly={true} spellCheck={false} value={predictionText} style={{margin: "0px", width: "100%", backgroundColor: "#14154f", marginTop: "5px", fontSize: "17px", minHeight: "150px"}}></textarea>
            </div> : null}
            <div className="point-options-container">
                <div className="point-row" style={{alignItems: "flex-start", width: "100%"}}>
                    <span className="point-text-2">Requirements:</span>
                </div>
                <div className="point-row" style={{marginTop: "5px", alignItems: "flex-start", width: "100%"}}>
                    <span className="point-text" style={{fontSize: "19px"}}>Download Python (<span className="network-link" style={{fontSize: "18px"}} onClick={() => shell.openExternal("https://www.python.org/downloads/")}>https://www.python.org/downloads/</span>)</span>
                </div>
                <div className="point-row" style={{marginTop: "5px", alignItems: "flex-start", width: "100%"}}>
                    <button className="point-image-button" onClick={deleteModels} style={{marginLeft: "0px", marginRight: "20px", fontSize: "17px", backgroundColor: "#fe2196", marginTop: "-2px"}}>Delete Models</button>
                </div>
            </div>
        </div>
    )
}

export default CLIPBreaker