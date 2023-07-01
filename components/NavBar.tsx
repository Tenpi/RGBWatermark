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
import crt from "../assets/icons/crt.png"
import rgbsplit from "../assets/icons/rgbsplit.png"
import adversarialnoise from "../assets/icons/adversarialnoise.png"
import aiwatermark from "../assets/icons/aiwatermark.png"
import steganography from "../assets/icons/steganography.png"
import invisiblewatermark from "../assets/icons/invisiblewatermark.png"
import clipbreaker from "../assets/icons/clipbreaker.png"
import glyphswap from "../assets/icons/glyphswap.png"
import textspoof from "../assets/icons/textspoof.png"
import bitcrush from "../assets/icons/bitcrush.png"
import pitchshift from "../assets/icons/pitchshift.png"
import blockreverse from "../assets/icons/blockreverse.png"
import pinknoise from "../assets/icons/pinknoise.png"
import decimation from "../assets/icons/decimation.png"

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
                <img className="navbar-item" src={crt} onClick={() => setAttackMode("crt")}/>
                <img className="navbar-item" src={rgbsplit} onClick={() => setAttackMode("rgb split")}/>
            </div>
            <div className="navbar-row">
                <img className="navbar-item" src={conversion} onClick={() => setAttackMode("conversion")}/>
                <img className="navbar-item" src={inflation} onClick={() => setAttackMode("inflation")}/>
                <img className="navbar-item" src={networkrandomizer} onClick={() => setAttackMode("network randomizer")}/>
                <img className="navbar-item" src={networkshifter} onClick={() => setAttackMode("network shifter")}/>
                <img className="navbar-item" src={aiwatermark} onClick={() => setAttackMode("ai watermark")}/>
            </div>
            <div className="navbar-row">
                <img className="navbar-item" src={steganography} onClick={() => setAttackMode("steganography")}/>
                <img className="navbar-item" src={invisiblewatermark} onClick={() => setAttackMode("invisible watermark")}/>
                <img className="navbar-item" src={clipbreaker} onClick={() => setAttackMode("clip breaker")}/>
                <img className="navbar-item" src={glyphswap} onClick={() => setAttackMode("glyph swap")}/>
                <img className="navbar-item" src={textspoof} onClick={() => setAttackMode("text spoof")}/>
            </div>
            <div className="navbar-row">
                <img className="navbar-item" src={bitcrush} onClick={() => setAttackMode("bitcrush")}/>
                <img className="navbar-item" src={pitchshift} onClick={() => setAttackMode("pitch shift")}/>
                <img className="navbar-item" src={blockreverse} onClick={() => setAttackMode("block reverse")}/>
                <img className="navbar-item" src={pinknoise} onClick={() => setAttackMode("pink noise")}/>
                <img className="navbar-item" src={decimation} onClick={() => setAttackMode("decimation")}/>
            </div>
        </div>
    )
}

export default NavBar