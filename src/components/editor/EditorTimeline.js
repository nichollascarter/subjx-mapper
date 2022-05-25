import React, { Component } from 'react';
import { Timeliner } from '../../packages/timeliner';

const defaultTimeline = {
    version: '0.0.0',
    modified: new Date(),
    title: 'Untitled',
    ui: {
        currentTime: 0.1,
        totalTime: 20,
        scrollTime: 0.1,
        timeScale: 60
    },
    // type: 'timeline',
    // tracks: [
    //     {
    //         name: 'Test1',
    //         tracks: [
    //             {
    //                 "values": [
    //                     {
    //                         "time": 0,
    //                         "value": 0,
    //                         "_color": "#557312",
    //                         "easing": "quadraticEaseIn"
    //                     },
    //                     {
    //                         "time": 5,
    //                         "value": 5,
    //                         "_color": "#5061c5"
    //                     }
    //                 ],
    //                 "_value": 5,
    //                 "_color": "#ff4d3e",
    //                 "name": "translateX",
    //                 "_mute": false
    //             }
    //         ]
    //     },
    //     {
    //         name: 'Test2',
    //         tracks: [{
    //             "values": [
    //                 {
    //                     "time": 0,
    //                     "value": 0,
    //                     "_color": "#bdd9a5",
    //                     "easing": "linearEaseNone"
    //                 },
    //                 {
    //                     "time": 5,
    //                     "value": 180.025,
    //                     "_color": "#18352e"
    //                 }
    //             ],
    //             "_value": 0,
    //             "_color": "#2728a",
    //             "name": "rotate"
    //         },
    //         {
    //             "values": [
    //                 {
    //                     "time": 0,
    //                     "value": 0,
    //                     "_color": "#bdd9a5",
    //                     "easing": "linearEaseNone"
    //                 },
    //                 {
    //                     "time": 5,
    //                     "value": 180.025,
    //                     "_color": "#18352e"
    //                 }
    //             ],
    //             "_value": 0,
    //             "_color": "#2728a",
    //             "name": "rotate"
    //         }]
    //     }
    // ],
    type: 'selector',
    tracks: [
        {
            name: 'Test1',
            tracks: [
                {
                    "values": [
                        {
                            value: 0,
                            _color: "#557312",
                            easing: "quadraticEaseIn",
                            state: false
                        },
                        {
                            "value": 5,
                            "_color": "#5061c5",
                            state: true
                        }
                    ],
                    "_value": 5,
                    "_color": "#ff4d3e",
                    "name": "translateX",
                    "_mute": false
                }
            ]
        },
        {
            name: 'Test2',
            tracks: [{
                "values": [
                    {
                        "value": 0,
                        "_color": "#bdd9a5",
                        "easing": "linearEaseNone",
                        state: false
                    },
                    {
                        "value": 180.025,
                        "_color": "#18352e",
                        state: true
                    }
                ],
                "_value": 0,
                "_color": "#2728a",
                "name": "rotate"
            },
            {
                "values": [
                    {
                        "value": 0,
                        "_color": "#bdd9a5",
                        "easing": "linearEaseNone",
                        state: false
                    },
                    {
                        "value": 180.025,
                        "_color": "#18352e",
                        state: false
                    }
                ],
                "_value": 0,
                "_color": "#2728a",
                "name": "rotate"
            }]
        }
    ],
    context: {
        name: 'Variable',
        variable: 'variable',
        type: 'boolean',
        states: [
            'false',
            'true'
        ],
        initialState: 'false'
    }
};

class EditorTimeliner extends Component {

    root = null;
    timeliner = new Timeliner({}, data => this.props.eventBus.emit('animate', null, data));

    componentDidMount() {
        const { eventBus } = this.props;

        setInterval(() => {
            //this.timeliner.save();
        }, 10000);

        eventBus.on('timeliner-payload', (uuid) => {
            const payload =
                localStorage.getItem(`timeliner-${uuid}`) ||
                localStorage.getItem(`timeliner-autosave`);

            const nextPayload = {
                ...(payload ? JSON.parse(payload) : defaultTimeline),
                name: uuid
            };

            this.timeliner.load(nextPayload);
        });


        if (this.root) {
            this.root.appendChild(this.timeliner.TimelinerUI.root);
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div id='editor-timeliner' ref={el => this.root = el} />
        );
    }

}

export default EditorTimeliner;
