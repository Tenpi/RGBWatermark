import {ipcRenderer, shell} from "electron"
import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {ImageContext, ImageNameContext} from "../renderer"
import functions from "../structures/Functions"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import folder from "../assets/icons/folder.png"
import folderHover from "../assets/icons/folder-hover.png"
import "./styles/networkrandomizer.less"


const NetworkRandomizer: React.FunctionComponent = (props) => {
    const [network, setNetwork] = useState("")
    const [networkName, setNetworkName] = useState("")
    const [destFolder, setDestFolder] = useState("")
    const [fHover, setFhover] = useState(false)
    const history = useHistory()

    useEffect(() => {
        ipcRenderer.invoke("get-downloads-folder").then((f) => {
            f = f.replace(/\\/g, "/")
            if (!f.endsWith("/")) f = `${f}/`
            setDestFolder(f)
        })
    }, [])

    const changeDirectory = async () => {
        let dir = await ipcRenderer.invoke("select-directory")
        if (dir) {
            dir = dir.replace(/\\/g, "/")
            if (!dir.endsWith("/")) dir = `${dir}/`
            setDestFolder(dir)
        }
    }

    const loadNetwork = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const ext = path.extname(file.name)
        let ckpt = ext === ".ckpt"
        let safetensors = ext === ".safetensors"
        let hypernetwork = ext === ".pt"
        let binary = ext === ".bin"
        let onnx = ext === ".onnx"
        if (ckpt || safetensors || hypernetwork || binary || onnx) {
            setNetwork(file.path)
            setNetworkName(file.name.slice(0, 30))
        }
        if (event.target) event.target.value = ""
    }

    const removeNetwork = () => {
        setNetwork("")
        setNetworkName("")
    }

    const randomize = () => {
        if (network && networkName && destFolder) {
            let newName = `${path.basename(networkName, path.extname(networkName))}_randomized${path.extname(networkName)}`
            const dest = path.join(destFolder, newName)
            ipcRenderer.invoke("randomize-network", network, dest)
        } 
    }

    return (
        <div className="network-randomizer">
            <div className="network-upload-container">
                <div className="network-row">
                    <span className="network-text">Network:</span>
                </div>
                <div className="network-row">
                    <label htmlFor="img" className="network-button" style={{width: "92px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" onChange={(event) => loadNetwork(event)}/>
                    {network ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} onClick={removeNetwork}/>
                            <span className="button-image-name">{networkName}</span>
                        </div>
                    : null}
                </div>
                <div className="network-row">
                    <span className="network-text">Dest:</span>
                </div>
                <div className="network-row">
                    <img className="network-folder" src={fHover ? folderHover : folder} onMouseEnter={() => setFhover(true)} onMouseLeave={() => setFhover(false)} onClick={changeDirectory}/>
                    <span className="network-text-alt" onDoubleClick={() => shell.openPath(path.normalize(destFolder))}>{destFolder}</span>
                </div>
                <div className="network-row">
                    <span className="network-text">Network randomizer takes in a network (.ckpt, .safetensors, .pt, .bin, .onnx) and outputs the network with randomized tensors. A randomized network will only produce noise.</span>
                </div>
                <div className="network-row">
                    <span className="network-text-2">Requirements:</span>
                </div>
                <div className="network-row">
                    <span className="network-text">Download Python (<span className="network-link" onClick={() => shell.openExternal("https://www.python.org/downloads/")}>https://www.python.org/downloads/</span>)</span>
                </div>
                <div className="network-row">
                    <span className="network-text-2">Install the script dependencies:</span>
                </div>
                <div className="network-row">
                    <span className="network-text" style={{userSelect: "all"}}>pip3 install torch safetensors onnx</span>
                </div>
                <div className="network-row">
                    <button className="network-button-2" onClick={randomize} style={{marginTop: "5px"}}>
                        <span className="button-hover">
                            <span className="button-text">Randomize</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NetworkRandomizer