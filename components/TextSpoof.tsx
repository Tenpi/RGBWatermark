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
import confusables from "../structures/confusables.json"
import "./styles/steganography.less"

const TextSpoof: React.FunctionComponent = (props) => {
    const [text, setText] = useState("")
    const [spoofedText, setSpoofedText] = useState("")
    const [error, setError] = useState("")
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const spoof = () => {
        const textArr = text.split("")
        let newTextArr = [] as string[]
        for (let i = 0; i < textArr.length; i++) {
            if (confusables[textArr[i]]) {
                const close = confusables[textArr[i]].close
                if (close.length) {
                    newTextArr.push(close[Math.floor(Math.random() * close.length)])
                } else {
                    newTextArr.push(textArr[i])
                }
            } else {
                newTextArr.push(textArr[i])
            }
            newTextArr.push("​")
        }
        setSpoofedText(newTextArr.join(""))
        navigator.clipboard.writeText(newTextArr.join(""))
    }

    const looseSpoof = () => {
        const textArr = text.split("")
        let newTextArr = [] as string[]
        for (let i = 0; i < textArr.length; i++) {
            if (confusables[textArr[i]]) {
                const close = confusables[textArr[i]].close
                const other = confusables[textArr[i]].other
                const items = [...close, ...other]
                if (items.length) {
                    newTextArr.push(items[Math.floor(Math.random() * items.length)])
                } else {
                    newTextArr.push(textArr[i])
                }
            } else {
                newTextArr.push(textArr[i])
            }
            newTextArr.push("​")
        }
        setSpoofedText(newTextArr.join(""))
        navigator.clipboard.writeText(newTextArr.join(""))
    }

    return (
        <div className="steg-image-component">
            <div className="steg-imageoptions-container">
            <div className="steg-options-container">
                <div className="steg-upload-container">
                    <div className="steg-row">
                        <span className="steg-text">Text:</span> 
                    </div>
                    <div className="steg-row">
                        <textarea className="steg-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}></textarea>
                    </div>
                </div>
            </div>
            {error ? <span className="steg-error">{error}</span> : null}
                <div className="steg-image-container">
                    <div className="steg-image-buttons-container">
                        <button className="steg-image-button" onClick={spoof} style={{backgroundColor: "#0910ff"}}>Spoof</button>
                        <button className="steg-image-button" onClick={looseSpoof} style={{backgroundColor: "#0910ff"}}>Loose Spoof</button>
                    </div>
                    {spoofedText ? 
                    <div className="steg-row">
                        <textarea className="steg-textarea" disabled={true} spellCheck={false} value={spoofedText}
                        style={{width: "65%", backgroundColor: "#0c0c3f", minHeight: "200px"}}></textarea>
                    </div> : null}
                </div>
            </div>
        </div>
    )
}

export default TextSpoof