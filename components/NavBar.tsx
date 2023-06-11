import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {AttackModeContext, StopAnimationContext} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import "./styles/navbar.less"

import pixelation from "../assets/icons/pixelation.png"
import highcontrast from "../assets/icons/highcontrast.png"
import pixelshift from "../assets/icons/pixelshift.png"
import pointifiction from "../assets/icons/pointifiction.png"
import rainbowWatermarks from "../assets/icons/rainbowwatermarks.png"
import noise from "../assets/icons/noise.png"
import edgeblur from "../assets/icons/edgeblur.png"
import sprinkles from "../assets/icons/sprinkles.png"
import networkrandomizer from "../assets/icons/networkrandomizer.png"
import networkshifter from "../assets/icons/networkshifter.png"
import conversion from "../assets/icons/conversion.png"
import inflation from "../assets/icons/inflation.png"
import fence from "../assets/icons/fence.png"
import adversarialnoise from "../assets/icons/adversarialnoise.png"
import aiwatermark from "../assets/icons/aiwatermark.png"

const NavBar: React.FunctionComponent = (props) => {
    const {attackMode, setAttackMode} = useContext(AttackModeContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        const savedAttackMode = localStorage.getItem("attackMode")
        if (savedAttackMode) setAttackMode(savedAttackMode)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        localStorage.setItem("attackMode", attackMode)
    }, [attackMode])

    return (
        <div className="navbar">
            <div className="navbar-row">
                <img className="navbar-item" src={rainbowWatermarks} onClick={() => setAttackMode("rainbow watermarks")}/>
                <img className="navbar-item" src={pointifiction} onClick={() => setAttackMode("pointifiction")}/>
                <img className="navbar-item" src={pixelshift} onClick={() => setAttackMode("pixel shift")}/>
                <img className="navbar-item" src={highcontrast} onClick={() => setAttackMode("high contrast")}/>
                <img className="navbar-item" src={pixelation} onClick={() => setAttackMode("pixelation")}/>
            </div>
            <div className="navbar-row">
                <img className="navbar-item" src={noise} onClick={() => setAttackMode("noise")}/>
                <img className="navbar-item" src={edgeblur} onClick={() => setAttackMode("edge blur")}/>
                <img className="navbar-item" src={sprinkles} onClick={() => setAttackMode("sprinkles")}/>
                <img className="navbar-item" src={fence} onClick={() => setAttackMode("fence")}/>
                <img className="navbar-item" src={adversarialnoise} onClick={() => setAttackMode("adversarial noise")}/>
                <img className="navbar-item" src={conversion} onClick={() => setAttackMode("conversion")}/>
                <img className="navbar-item" src={inflation} onClick={() => setAttackMode("inflation")}/>
            </div>
            <div className="navbar-row">
                <img className="navbar-item" src={networkrandomizer} onClick={() => setAttackMode("network randomizer")}/>
                <img className="navbar-item" src={networkshifter} onClick={() => setAttackMode("network shifter")}/>
                <img className="navbar-item" src={aiwatermark} onClick={() => setAttackMode("ai watermark")}/>
            </div>
        </div>
    )
}

export default NavBar