import React, {ChangeEvent} from "react";
import {allowedCharacters, getRandomInt, wirings, endWiring} from "./Constants";
import LineTo from "react-lineto";
import _ from "lodash";
import {ReactCookieProps, withCookies} from "react-cookie";

class Rotor {
    num: number;
    position: number;

    constructor(num: number, position: number) {
        this.num = num;
        this.position = position;
    }

    runThrough = (input: number, forward: boolean) => {
        let wiring = wirings[this.num];
        if (forward) {
            input = (input + this.position) % wiring.length;

            return wiring[input][1];
        } else {
            for (let ints of wiring) {
                if (input === ints[1]) {
                    let output = (ints[0] - this.position);
                    while (output < 0) {
                        output = wiring.length + output;
                    }
                    output = output % wiring.length;

                    return output;
                }
            }
        }
        return -1;
    };


    toCookieValue = () => `{"num": ${this.num}, "position": ${this.position}}`;

}

class Plug {
    readonly conn1: string;
    readonly conn2: string;
    readonly color: string;

    constructor(conn1: string, conn2: string, color: string) {
        this.conn1 = conn1;
        this.conn2 = conn2;
        this.color = color;
    }

    public get connection1() { return allowedCharacters.indexOf(this.conn1.toLowerCase()); }
    public get connection2() { return allowedCharacters.indexOf(this.conn2.toLowerCase()); }

    toJson = () => {
        return {
            conn1: this.conn1,
            conn2: this.conn2,
            color: this.color,
        }
    }
}

interface EnigmaState {
    pressedKey: string | null;
    litKey: string | null;
    rotor1: Rotor;
    rotor2: Rotor;
    rotor3: Rotor;
    darkMode: boolean;
    plugs: Plug[];
    cipherText: string;
}

class Enigma extends React.Component<ReactCookieProps, EnigmaState> {

    initialPlugs: Plug[];

    constructor(props: ReactCookieProps) {
        super(props);
        let rotors: {
            rotor1: Rotor,
            rotor2: Rotor,
            rotor3: Rotor,
        } = this.setupRotors();
        let dm = props.cookies?.get("darkMode") || "FALSE";
        let plugs: Plug[] = [];

        let plugsStr = props.cookies?.get("plugs", {doNotParse: true});
        if (plugsStr) {
            let plugsArr = JSON.parse(plugsStr);
            for (let plug of plugsArr) {
                if (!plug["conn1"] || !plug["conn2"] || !plug["color"]) continue;
                plugs.push(new Plug(plug["conn1"], plug["conn2"], plug["color"]));
            }
        }

        this.initialPlugs = plugs;

        this.state = {
            pressedKey: null,
            litKey: null,
            ...rotors,
            darkMode: dm.toString().toUpperCase() === "TRUE",
            plugs: plugs,
            cipherText: "",
        };
        if (dm) document.body.classList.add('dark');
        setInterval(this.saveCookieData, 30000);
    }

    setupRotors = (): {
        rotor1: Rotor,
        rotor2: Rotor,
        rotor3: Rotor,
    } => {
        let rotor1: Rotor | null = null;
        let rotor2: Rotor | null = null;
        let rotor3: Rotor | null = null;

        let rotor1Cookie = this.props.cookies?.get("rotor1", {doNotParse: true});
        if (rotor1Cookie) {
            let rotor1Obj = JSON.parse(rotor1Cookie);
            if (rotor1Obj)
                rotor1 = new Rotor(rotor1Obj["num"], rotor1Obj["position"]);
        }

        let rotor2Cookie = this.props.cookies?.get("rotor2", {doNotParse: true});
        if (rotor2Cookie) {
            let rotor2Obj = JSON.parse(rotor2Cookie);
            if (rotor2Obj)
                rotor2 = new Rotor(rotor2Obj["num"], rotor2Obj["position"]);
        }

        let rotor3Cookie = this.props.cookies?.get("rotor3", {doNotParse: true});
        if (rotor3Cookie) {
            let rotor3Obj = JSON.parse(rotor3Cookie);
            if (rotor3Obj)
                rotor3 = new Rotor(rotor3Obj["num"], rotor3Obj["position"]);
        }

        if (!rotor1) {
            if (!rotor2) {
                if (!rotor3) {
                    let r1 = getRandomInt(5);
                    let r2 = getRandomInt(5);
                    while (r1 === r2) r2 = getRandomInt(5);

                    let r3 = getRandomInt(5);
                    while (r3 === r1 || r3 === r2) r3 = getRandomInt(5);

                    rotor1 = new Rotor(r1, getRandomInt(wirings[r1].length));
                    rotor2 = new Rotor(r2, getRandomInt(wirings[r2].length));
                    rotor3 = new Rotor(r3, getRandomInt(wirings[r3].length));

                } else {
                    let r3 = rotor3.num;

                    let r1 = getRandomInt(5);
                    while (r1 === r3) r1 = getRandomInt(5);

                    let r2 = getRandomInt(5);
                    while (r2 === r1 || r2 === r3) r2 = getRandomInt(5);

                    rotor1 = new Rotor(r1, getRandomInt(wirings[r1].length));
                    rotor2 = new Rotor(r2, getRandomInt(wirings[r2].length));

                }
            } else {
                let r2 = rotor2.num;

                if (!rotor3) {
                    let r1 = getRandomInt(5);
                    while (r1 === r2) r1 = getRandomInt(5);

                    let r3 = getRandomInt(5);
                    while (r3 === r1 || r3 === r2) r3 = getRandomInt(5);

                    rotor1 = new Rotor(r1, getRandomInt(wirings[r1].length));
                    rotor3 = new Rotor(r3, getRandomInt(wirings[r3].length));

                } else {
                    let r3 = rotor3.num;

                    let r1 = getRandomInt(5);
                    while (r1 === r2 || r1 === r3) r1 = getRandomInt(5);

                    rotor1 = new Rotor(r1, getRandomInt(wirings[r1].length))
                }
            }
        } else {
            let r1 = rotor1.num;

            if (!rotor2) {
                if (!rotor3) {
                    let r2 = getRandomInt(5);
                    while (r1 === r2) r2 = getRandomInt(5);

                    let r3 = getRandomInt(5);
                    while (r3 === r1 || r3 === r2) r3 = getRandomInt(5);

                    rotor2 = new Rotor(r2, getRandomInt(wirings[r2].length));
                    rotor3 = new Rotor(r3, getRandomInt(wirings[r3].length));

                } else {
                    let r3 = rotor3.num;

                    let r2 = getRandomInt(5);
                    while (r2 === r1 || r2 === r3) r2 = getRandomInt(5);

                    rotor2 = new Rotor(r2, getRandomInt(wirings[r2].length));

                }
            } else {
                let r2 = rotor2.num;

                if (!rotor3) {
                    let r3 = getRandomInt(5);
                    while (r3 === r1 || r3 === r2) r3 = getRandomInt(5);

                    rotor3 = new Rotor(r3, getRandomInt(wirings[r3].length));
                }
            }
        }

        return {
            rotor1: rotor1,
            rotor2: rotor2,
            rotor3: rotor3,
        };
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keydown);
        document.addEventListener("keyup", this.keyup);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.keydown);
        document.removeEventListener("keyup", this.keyup);
    }

    saveCookieData = () => {
        this.props.cookies?.set("rotor1", this.state.rotor1.toCookieValue());
        this.props.cookies?.set("rotor2", this.state.rotor2.toCookieValue());
        this.props.cookies?.set("rotor3", this.state.rotor3.toCookieValue());

        let plugs: { conn1: string, conn2: string, color: string }[] = [];

        for (let plug of this.state.plugs) {
            plugs.push(plug.toJson());
        }

        this.props.cookies?.set("plugs", JSON.stringify(plugs));
    }

    keydown = (event: KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        let key = event.key;
        if (key === "Tab") key = "\t";
        if (this.state.pressedKey === null && allowedCharacters.includes(key)) {
            let cipherKey = this.runMachine(key);
            this.setState((prevState) => {
                return {
                    pressedKey: key,
                    litKey: cipherKey,
                    cipherText: prevState.cipherText + cipherKey,
                }
            });
        }
    }

    keyup = (event: KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        let key = event.key;
        if (key === "Tab") key = "\t";
        if (this.state.pressedKey !== null && this.state.pressedKey === key)
            this.setState({pressedKey: null, litKey: null})
    }

    runThroughPlugs = (input: number) => {
        for (let plug of this.state.plugs) {
            if (plug.connection1 === input)
                return plug.connection2;
            if (plug.connection2 === input)
                return plug.connection1;
        }
        return input;
    }

    runMachine = (char: string) => {
        if (this.state.rotor1 === this.state.rotor2 || this.state.rotor3 === this.state.rotor2 || this.state.rotor1 === this.state.rotor3) {
            console.error("Error rotors cannot have the same number");
            return '?';
        }

        let { rotor1, rotor2, rotor3 } = this.state;

        let currentNo = allowedCharacters.indexOf(char);
        currentNo = this.runThroughPlugs(currentNo);
        currentNo = rotor1.runThrough(currentNo, true);
        currentNo = rotor2.runThrough(currentNo, true);
        currentNo = rotor3.runThrough(currentNo, true);
        currentNo = endWiring[currentNo%endWiring.length][1];
        currentNo = rotor3.runThrough(currentNo, false);
        currentNo = rotor2.runThrough(currentNo, false);
        currentNo = rotor1.runThrough(currentNo, false);
        currentNo = this.runThroughPlugs(currentNo);

        rotor1.position += 1;
        if (rotor1.position === wirings[rotor1.num].length) {
            rotor1.position = 0;
            rotor2.position+=1;
            if (rotor2.position === wirings[rotor2.num].length) {
                rotor2.position = 0;
                rotor3.position+=1;
                if (rotor3.position === wirings[rotor3.num].length) {
                    rotor3.position = 0;
                }
            }
        }

        this.setState({
            rotor1: rotor1,
            rotor2: rotor2,
            rotor3: rotor3
        });

        if (currentNo === -1) {
            console.error(this.state.rotor1.position + ", " + this.state.rotor2.position + ", " + this.state.rotor3.position);
        }

        return allowedCharacters.charAt(currentNo);
    }

    toggleDarkMode = (event: ChangeEvent<HTMLInputElement>) => {
        let value = event.target.checked;
        this.props.cookies?.set("darkMode", value, {path: "/"});
        this.setState({darkMode: value});
        if (value) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
    }

    render() {
        return (
            <div className={'ek-container'}>
                <div style={{paddingBottom: "10px"}} className={'ek-row'}>
                    { /* rotor editors */ }
                    <div style={{marginRight: "5px"}} className={'ek-column'}>
                        <div className={'ek-row'}>
                            <button
                                className={`rotor-number ${this.state.darkMode ? 'dark' : ''}`}
                                onClick={() => {
                                    let {rotor1, rotor2, rotor3} = this.state;
                                    let ogNum = rotor3.num;
                                    let nextNum = (ogNum + 1) % 5;
                                    while (nextNum !== ogNum && (nextNum === rotor1.num || nextNum === rotor2.num))
                                        nextNum = (nextNum + 1) % 5;
                                    rotor3.num = nextNum;
                                    this.setState({rotor3: rotor3});
                                }}
                            >{this.state.rotor3.num}</button>
                        </div>

                        <button
                            style={{borderTopLeftRadius: "0", borderTopRightRadius: "0"}}
                            className={`flipped ${this.state.darkMode ? 'dark' : ''}`}
                            onClick={() => {
                                let rotor = this.state.rotor3;
                                rotor.position = (rotor.position+1) % (wirings[rotor.num].length);
                                this.setState({rotor3: rotor});
                            }}
                        >
                            &#x25BE;
                        </button>
                        <div className={`rotor-position ${this.state.darkMode ? 'dark' : ''}`}>
                            {this.state.rotor3.position}
                        </div>
                        <button
                            style={{borderTopLeftRadius: "0", borderTopRightRadius: "0"}}
                            className={this.state.darkMode ? 'dark' : ''}
                            onClick={() => {
                                let rotor = this.state.rotor3;
                                if (rotor.position === 0) rotor.position = wirings[rotor.num].length;
                                rotor.position = (rotor.position-1);
                                this.setState({rotor3: rotor});
                            }}
                        >
                            &#x25BE;
                        </button>
                    </div>

                    <div style={{marginRight: "5px"}} className={'ek-column'}>
                        <div className={'ek-row'}>
                            <button
                                className={`rotor-number ${this.state.darkMode ? 'dark' : ''}`}
                                onClick={() => {
                                    let {rotor1, rotor2, rotor3} = this.state;
                                    let ogNum = rotor2.num;
                                    let nextNum = (ogNum + 1) % 5;
                                    while (nextNum !== ogNum && (nextNum === rotor3.num || nextNum === rotor1.num))
                                        nextNum = (nextNum + 1) % 5;
                                    rotor2.num = nextNum;
                                    this.setState({rotor2: rotor2});
                                }}
                            >{this.state.rotor2.num}</button>
                        </div>

                        <button
                            style={{borderTopLeftRadius: "0", borderTopRightRadius: "0"}}
                            className={`flipped ${this.state.darkMode ? 'dark' : ''}`}
                            onClick={() => {
                                let rotor = this.state.rotor2;
                                rotor.position = (rotor.position+1) % (wirings[rotor.num].length);
                                this.setState({rotor2: rotor});
                            }}
                        >
                            &#x25BE;
                        </button>
                        <div className={`rotor-position ${this.state.darkMode ? 'dark' : ''}`}>
                            {this.state.rotor2.position}
                        </div>
                        <button
                            style={{borderTopLeftRadius: "0", borderTopRightRadius: "0"}}
                            className={this.state.darkMode ? 'dark' : ''}
                            onClick={() => {
                                let rotor = this.state.rotor2;
                                if (rotor.position === 0) rotor.position = wirings[rotor.num].length;
                                rotor.position = (rotor.position-1);
                                this.setState({rotor2: rotor});
                            }}
                        >
                            &#x25BE;
                        </button>
                    </div>

                    <div style={{marginRight: "5px"}} className={'ek-column'}>
                        <div className={'ek-row'}>
                            <button
                                className={`rotor-number ${this.state.darkMode ? 'dark' : ''}`}
                                onClick={() => {
                                    let {rotor1, rotor2, rotor3} = this.state;
                                    let ogNum = rotor1.num;
                                    let nextNum = (ogNum + 1) % 5;
                                    while (nextNum !== ogNum && (nextNum === rotor3.num || nextNum === rotor2.num))
                                        nextNum = (nextNum + 1) % 5;
                                    rotor1.num = nextNum;
                                    this.setState({rotor1: rotor1});
                                }}
                            >{this.state.rotor1.num}</button>
                        </div>

                        <button
                            style={{borderTopLeftRadius: "0", borderTopRightRadius: "0"}}
                            className={`flipped ${this.state.darkMode ? 'dark' : ''}`}
                            onClick={() => {
                                let rotor = this.state.rotor1;
                                rotor.position = (rotor.position+1) % (wirings[rotor.num].length);
                                this.setState({rotor1: rotor});
                            }}
                        >
                            &#x25BE;
                        </button>
                        <div className={`rotor-position ${this.state.darkMode ? 'dark' : ''}`}>
                            {this.state.rotor1.position}
                        </div>
                        <button
                            style={{borderTopLeftRadius: "0", borderTopRightRadius: "0"}}
                            className={this.state.darkMode ? 'dark' : ''}
                            onClick={() => {
                                let rotor = this.state.rotor1;
                                if (rotor.position === 0) rotor.position = wirings[rotor.num].length;
                                rotor.position = (rotor.position-1);
                                this.setState({rotor1: rotor});
                            }}
                        >
                            &#x25BE;
                        </button>
                    </div>

                    <div style={{borderLeft: "1px solid #888", height: "100px", marginRight: "8px", marginLeft: "8px"}} />

                    <label className={this.state.darkMode ? "dark-mode-text" : ""}>
                        <input
                            style={{marginRight: "5px"}}
                            name={"darkMode"}
                            type={"checkbox"}
                            checked={this.state.darkMode}
                            onChange={this.toggleDarkMode}
                        />
                        Dark Mode
                    </label>
                </div>
                <div className={'ek-row'}>
                    {'1234567890'.split('').map((char) =>
                        <KeyboardChar
                            key={char}
                            char={char}
                            pressed={char === this.state.litKey?.toUpperCase()}
                            darkMode={this.state.darkMode}
                        />
                    )}
                </div>
                <div className={'ek-row'}>
                    <KeyboardChar
                        char={'Tab'}
                        pressed={"\t" === this.state.litKey}
                        darkMode={this.state.darkMode}
                    />
                    {'QWERTYUIOP'.split('').map((char) =>
                        <KeyboardChar
                            key={char}
                            char={char}
                            pressed={char === this.state.litKey?.toUpperCase()}
                            darkMode={this.state.darkMode}
                        />
                    )}
                </div>
                <div className={'ek-row'}>
                    {'ASDFGHJKL'.split('').map((char) =>
                        <KeyboardChar
                            key={char}
                            char={char}
                            pressed={char === this.state.litKey?.toUpperCase()}
                            darkMode={this.state.darkMode}
                        />
                    )}
                </div>
                <div className={'ek-row'}>
                    {'ZXCVBNM'.split('').map((char) =>
                        <KeyboardChar
                            key={char}
                            char={char}
                            pressed={char === this.state.litKey?.toUpperCase()}
                            darkMode={this.state.darkMode}
                        />
                    )}
                </div>
                <div className={'ek-row'}>
                    <KeyboardChar
                        char={'Space'}
                        pressed={" " === this.state.litKey}
                        darkMode={this.state.darkMode}
                    />
                </div>
                <div
                    className={'ek-row'}
                    style={{
                        alignItems: "stretch",
                        marginTop: "8px",
                        marginBottom: "8px",
                    }}
                >
                    <input
                        style={{
                            height: "35px",
                            width: "300px",
                            borderRadius: "2px",
                            border: "none",
                            marginRight: "10px",
                        }}
                        value={this.state.cipherText}
                    />
                    <button
                        className={this.state.darkMode ? 'dark' : ''}
                        style={{padding: "0 15px"}}
                        onClick={() => {
                            this.setState({
                                cipherText: "",
                            });
                        }}
                    >
                        Clear
                    </button>
                </div>
                <div className={'ek-row'}><hr /></div>
                <div
                    className={'ek-row'}
                    style={{
                        fontSize: "18pt",
                        color: this.state.darkMode ? "#eee" : "black",
                        paddingBottom: "5px",
                    }}
                >
                    Plugboard
                </div>
                <Plugboard
                    darkMode={this.state.darkMode}
                    setPlugs={(plugs) => {
                        this.setState({
                            plugs: plugs
                        });
                    }}
                    initialPlugs={this.initialPlugs}
                />
            </div>
        );
    }
}

function KeyboardChar(props: {char: string, pressed: boolean, darkMode: boolean}) {
    return (
        <div
            className={`keyboard-char ${props.darkMode ? 'dark' : ''} ${props.pressed ? 'pressed' : ''}`}
            style={props.char === 'Tab' ? {
                width: "100px"
            } : props.char === 'Space' ? {
                width: "200px",
                height: "70px"
            } : {}}
        >
            <p>{props.char}</p>
        </div>
    );
}

interface PlugboardProps {
    darkMode: boolean;
    setPlugs: (plugs: Plug[]) => void,
    initialPlugs: Plug[],
}

interface PlugboardState {
    plugs: Plug[];
    fromChar: string | null;
    currentColor: string;
    hoveringChar: string | null;
}

export class Plugboard extends React.Component<PlugboardProps, PlugboardState> {

    constructor(props: PlugboardProps) {
        super(props);

        this.state = {
            plugs: props.initialPlugs,
            fromChar: null,
            currentColor: "",
            hoveringChar: null
        };
    }

    componentDidMount() {
        this.setState({});
    }

    clicked = (char: string) => {
        let plugs = _.cloneDeep(this.state.plugs)
            .filter(plug => !(plug.conn1 === char || plug.conn2 === char));

        if (this.state.fromChar === char)
            this.setState({fromChar: null, plugs: plugs});
        else {
            if (this.state.fromChar === null) {
                this.setState({fromChar: char, plugs: plugs});
                return;
            }

            plugs.push(new Plug(this.state.fromChar, char, this.state.currentColor));

            this.setState({
                fromChar: null,
                plugs: plugs,
            });

            this.props.setPlugs(plugs);
        }
    }

    hover = (char: string, hovering: boolean) => {
        if (hovering) {
            if (this.state.fromChar !== null)
                this.setState({hoveringChar: char});
            else
                this.setState({
                    hoveringChar: char,
                    currentColor: `#${getRandomInt(256).toString(16).padStart(2, "0")}${getRandomInt(256).toString(16).padStart(2, "0")}${getRandomInt(256).toString(16).padStart(2, "0")}`
                });
        } else if (this.state.hoveringChar === char) {
            this.setState({hoveringChar: null})
        }
    }

    themeClass = () => {
        if (this.props.darkMode)
            return "dark";
        return "";
    }

    characterMapper = (char: string) => {
        let style: React.CSSProperties = {};
        if (char === "\t") {
            style["width"] = "100px";
        }
        let plug = this.state.plugs.find((plug) => plug.conn1 === char || plug.conn2 === char);

        if (plug)
            style["backgroundColor"] = plug.color;
        else if (this.state.fromChar === char || this.state.hoveringChar === char)
            style["backgroundColor"] = this.state.currentColor;

        return (
            <div
                key={`Character-${char === "\t" ? "Tab" : char}`}
                className={`keyboard-char plugboard-char ${this.themeClass()} Character-${char === "\t" ? "Tab" : char}`}
                style={style}
                onClick={() => this.clicked(char)}
                onMouseEnter={() => this.hover(char, true)}
                onMouseLeave={() => this.hover(char, false)}
            >
                <p style={{zIndex: 10}}>{char === "\t" ? "Tab" : char}</p>
            </div>
        );
    }

    render() {
        return (
            <div>
                <div className={'ek-row'}>
                    {"1234567890".split("").map(this.characterMapper)}
                </div>
                <div className={'ek-row'}>
                    {"\tQWERTYUIOP".split("").map(this.characterMapper)}
                </div>
                <div className={'ek-row'}>
                    {"ASDFGHJKL".split("").map(this.characterMapper)}
                </div>
                <div className={'ek-row'}>
                    {"ZXCVBNM".split("").map(this.characterMapper)}
                </div>
                <div className={'ek-row'}>
                    {(() => {
                        let char = " ";
                        let plug = this.state.plugs.find((plug) => plug.conn1 === char || plug.conn2 === char);
                        let style: React.CSSProperties = {
                            width: "200px",
                            height: "70px",
                        }

                        if (plug)
                            style["backgroundColor"] = plug.color;
                        else if (this.state.fromChar === char || this.state.hoveringChar === char)
                            style["backgroundColor"] = this.state.currentColor;

                        return (
                            <div
                                className={`keyboard-char plugboard-char ${this.themeClass()} Character-Space`}
                                style={style}
                                onClick={() => this.clicked(char)}
                                onMouseEnter={() => this.hover(char, true)}
                                onMouseLeave={() => this.hover(char, false)}
                            >
                                <p style={{zIndex: 10}}>Space</p>
                            </div>
                        );
                    })()}
                </div>
                {this.state.plugs.map(plug => {
                    return (
                        <LineTo
                            key={`Plug-${plug.conn1}-${plug.conn2}`}
                            from={`Character-${plug.conn1 === "\t" ? "Tab" : plug.conn1 === " " ? "Space" : plug.conn1}`}
                            to={`Character-${plug.conn2 === "\t" ? "Tab" : plug.conn2 === " " ? "Space" : plug.conn2}`}
                            fromAnchor={"middle middle"}
                            toAnchor={"middle middle"}
                            borderWidth={3}
                            borderColor={plug.color}
                        />
                    );
                })}
            </div>
        );
    }

}

export default withCookies(Enigma);
