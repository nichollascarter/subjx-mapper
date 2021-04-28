import React, { useState, useEffect } from 'react';
import subjx from 'subjx';
import {
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@material-ui/core';
import {
    Crop32Outlined as Rectangle,
    RadioButtonUnchecked as Circle,
    GradeOutlined as Shape,
    //CropOriginalOutlined as Image,
    TextFormat as Text
} from '@material-ui/icons';

const items = [
    ['rectangle', Rectangle],
    ['circle', Circle],
    ['shape', Shape],
    ['text', Text]
    // ['image', Image]
];

const EditorItems = (props) => {
    const droppables = [];
    const [isCloneable, setAsCloneable] = useState(false);

    const cloneConfig = {
        appendTo: 'body',
        stack: '#editor-background',
        style: {
            border: 'none',
            background: 'transparent',
            maxWidth: '150px',
            textColor: 'transparent'
        },
        onInit() {},
        onDrop(e) {
            const itemType = this.el.getAttribute('data-type');
            let newItem = null;

            const editorRef = document.querySelector('#editor-background');

            const offset = editorRef.getBoundingClientRect(),
                x = e.clientX - offset.left + editorRef.scrollLeft,
                y = e.clientY - offset.top + editorRef.scrollTop;

            switch (itemType) {

                case 'rectangle':
                    newItem = [
                        'rect',
                        {
                            x,
                            y,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        }
                    ];
                    break;
                case 'circle':
                    newItem = [
                        'ellipse',
                        {
                            cx: x,
                            cy: y,
                            rx: 45,
                            ry: 45,       
                            stroke: 'black',
                            fill: 'transparent'
                        }
                    ];
                    break;
                case 'shape':
                    newItem = [
                        'polygon',
                        {
                            strokeWidth: '1',
                            stroke: 'black',
                            fill: "transparent",
                            strokeDasharray: "0",
                            points: `${x + 80},${y} ${x + 160},${y + 50} ${x + 80},${y + 100} ${x},${y + 50}`
                        },
                        []
                    ];
                    break;
                case 'image':
                    newItem = [
                        'foreignObject',
                        {
                            x,
                            y,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        },
                        [
                            [
                                'div',
                                {
                                    display: 'block'
                                },
                                ['text']
                            ]
                        ]
                    ];
                    break;
                case 'text':
                    newItem = [
                        'text',
                        {
                            x,
                            y
                        },
                        'text'
                    ];
                    break;
                default:
                    break;

            }

            props.onDrop(
                e,
                newItem
            );
        }
    };

    useEffect(() => {
        if (isCloneable) return;
        droppables.forEach(el => subjx(el).clone(cloneConfig));
        setAsCloneable(true);
    }, [droppables, isCloneable, cloneConfig]);

    return (
        <List>
            {items.map(([text, Icon]) => (
                <ListItem
                    data-type={text}
                    ref={(el) => droppables.push(el)}
                    button
                    key={text}
                >
                    <ListItemIcon>
                        <Icon />
                    </ListItemIcon>
                    <ListItemText primary={text} />
                </ListItem>
            ))}
        </List>
    );
};

export default EditorItems;